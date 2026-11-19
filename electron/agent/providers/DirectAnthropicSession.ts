import type { NormalizedTurn } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolResult, ModelTurnResult } from '../types';

export interface DirectAnthropicConfig {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens?: number;
}

export class DirectAnthropicSession implements ModelSession {
  public readonly provider = 'claudecode' as const;
  public readonly model: string;
  private apiKey: string;
  private turns: NormalizedTurn[];
  private systemInstruction: string;
  private temperature: number;

  constructor(cfg: DirectAnthropicConfig) {
    this.apiKey = cfg.apiKey.trim();
    this.model = cfg.model || 'claude-3-7-sonnet';
    this.turns = [...cfg.turns];
    this.systemInstruction = cfg.systemInstruction || '';
    this.temperature = cfg.temperature ?? 0.2;
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, _opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const messages = this.turns.map((t) => ({
      role: t.role === 'user' ? 'user' : 'assistant',
      content: t.text
    }));

    const body: Record<string, any> = {
      model: this.model,
      messages: messages.length ? messages : [{ role: 'user', content: 'hello' }],
      max_tokens: 8192,
      temperature: this.temperature,
      stream: true,
      ...(this.systemInstruction ? { system: this.systemInstruction } : {})
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Anthropic Cloud Error (HTTP ${res.status}): ${errBody?.error?.message || res.statusText}`);
    }

    let text = '';
    let thinking = '';
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
            if (ev.type === 'content_block_delta') {
              if (ev.delta?.type === 'text_delta' && ev.delta?.text) {
                text += ev.delta.text;
                handlers.onText(ev.delta.text);
              } else if (ev.delta?.type === 'thinking_delta' && ev.delta?.thinking) {
                thinking += ev.delta.thinking;
                handlers.onThinking(ev.delta.thinking);
              }
            }
          } catch {}
        }
      }
    }

    this.turns.push({ role: 'model', text });
    return { text, thinking, toolCalls: [], finishReason: 'STOP' };
  }

  public appendToolResults(results: ModelToolResult[]) {
    const formatted = results.map((r) => `[Tool: ${r.name}] -> ${r.failed ? 'ERROR: ' : ''}${r.output}`).join('\n');
    this.turns.push({ role: 'user', text: `[Tool Execution Results]\n${formatted}` });
  }

  public appendUserText(text: string) {
    const last = this.turns[this.turns.length - 1];
    if (last?.role === 'user') last.text += `\n${text}`;
    else this.turns.push({ role: 'user', text });
  }
}
