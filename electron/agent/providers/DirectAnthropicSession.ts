import { toAnthropicTools } from '../tools/definitions';
import type { NormalizedTurn } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolCall, ModelToolResult, ModelTurnResult, ReasoningEffort } from '../types';

export interface DirectAnthropicConfig {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens?: number;
  reasoningEffort?: ReasoningEffort;
}

const THINKING_BUDGETS: Record<string, number> = { low: 2048, medium: 6144, high: 12288 };

export class DirectAnthropicSession implements ModelSession {
  public readonly provider = 'claudecode' as const;
  public readonly model: string;
  private readonly apiKey: string;
  private readonly systemInstruction: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  private readonly reasoningEffort: ReasoningEffort;
  private messages: Array<{ role: 'user' | 'assistant'; content: any }>;

  constructor(cfg: DirectAnthropicConfig) {
    this.apiKey = cfg.apiKey.trim();
    this.model = cfg.model || 'claude-3-7-sonnet';
    this.systemInstruction = cfg.systemInstruction || '';
    this.temperature = cfg.temperature ?? 0.2;
    this.maxOutputTokens = cfg.maxOutputTokens ?? 8192;
    this.reasoningEffort = cfg.reasoningEffort || 'medium';
    this.messages = cfg.turns.map((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }));
  }

  private buildBody(allowTools: boolean): Record<string, any> {
    const budget = THINKING_BUDGETS[this.reasoningEffort] || 0;
    const supportsThinking = budget > 0 && /claude-(3-7|sonnet-4|sonnet-5|opus-4|opus-5|fable)/i.test(this.model);
    const maxTokens = supportsThinking ? Math.max(this.maxOutputTokens, budget + 2048) : this.maxOutputTokens;
    return {
      model: this.model,
      messages: this.messages.length ? this.messages : [{ role: 'user', content: 'hello' }],
      max_tokens: maxTokens,
      temperature: supportsThinking ? 1 : this.temperature,
      stream: true,
      ...(supportsThinking ? { thinking: { type: 'enabled', budget_tokens: budget } } : {}),
      ...(allowTools ? { tools: toAnthropicTools() } : {}),
      ...(this.systemInstruction ? { system: this.systemInstruction } : {})
    };
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(this.buildBody(opts.allowTools)),
      signal
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Anthropic Cloud Error (HTTP ${res.status}): ${errBody?.error?.message || res.statusText}`);
    }

    let text = '', thinking = '', finishReason = 'STOP';
    const blocks = new Map<number, { type: string; id?: string; name?: string; json?: string }>();
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const ev = JSON.parse(jsonStr);
            if (ev.type === 'content_block_start' && ev.content_block) {
              blocks.set(ev.index, { type: ev.content_block.type, id: ev.content_block.id, name: ev.content_block.name, json: '' });
            } else if (ev.type === 'content_block_delta') {
              if (ev.delta?.type === 'text_delta' && ev.delta?.text) { text += ev.delta.text; handlers.onText(ev.delta.text); }
              else if (ev.delta?.type === 'thinking_delta' && ev.delta?.thinking) { thinking += ev.delta.thinking; handlers.onThinking(ev.delta.thinking); }
              else if (ev.delta?.type === 'input_json_delta' && ev.delta?.partial_json) {
                const blk = blocks.get(ev.index);
                if (blk) blk.json = (blk.json || '') + ev.delta.partial_json;
              }
            } else if (ev.type === 'message_delta' && ev.delta?.stop_reason) {
              finishReason = ev.delta.stop_reason;
            }
          } catch {}
        }
      }
    }

    const toolCalls: ModelToolCall[] = [];
    const contentBlocks: any[] = [];
    if (text) contentBlocks.push({ type: 'text', text });
    for (const blk of blocks.values()) {
      if (blk.type === 'tool_use' && blk.name) {
        let parsedArgs: Record<string, any> = {};
        let argsError: string | undefined;
        try { parsedArgs = blk.json?.trim() ? JSON.parse(blk.json) : {}; } catch { argsError = `Invalid JSON: ${(blk.json || '').slice(0, 160)}`; }
        const id = blk.id || `ant_${Date.now()}_${toolCalls.length}`;
        toolCalls.push({ id, name: blk.name, args: parsedArgs, ...(argsError ? { argsError } : {}) });
        contentBlocks.push({ type: 'tool_use', id, name: blk.name, input: parsedArgs });
      }
    }
    this.messages.push({ role: 'assistant', content: contentBlocks.length ? contentBlocks : text });
    return { text, thinking, toolCalls, finishReason };
  }

  public appendToolResults(results: ModelToolResult[]) {
    this.messages.push({
      role: 'user',
      content: results.map((r) => ({ type: 'tool_result', tool_use_id: r.id, content: r.output, is_error: r.failed }))
    });
  }

  public appendUserText(text: string) {
    this.messages.push({ role: 'user', content: text });
  }
}
