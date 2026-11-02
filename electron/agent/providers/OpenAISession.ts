import { toOpenAITools } from '../tools/definitions';
import { openStream } from './streamHttp';
import { ThinkTagSplitter } from './thinkTagSplitter';
import type { NormalizedTurn } from '../context/historyBuilder';
import { toOpenAIMessages } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolCall, ModelToolResult, ModelTurnResult, ProviderId, ReasoningEffort } from '../types';

export interface OpenAISessionConfig {
  provider: Extract<ProviderId, 'openai' | 'ollama'>;
  apiKey: string;
  baseUrl: string;
  model: string;
  systemInstruction: string;
  turns: NormalizedTurn[];
  temperature: number;
  reasoningEffort?: ReasoningEffort;
}

/** Reasoning model families that reject a custom temperature. */
const FIXED_TEMPERATURE_MODELS = /^(o\d|gpt-5)/i;

interface PendingToolCall { id: string; name: string; args: string }

export class OpenAISession implements ModelSession {
  public readonly provider: Extract<ProviderId, 'openai' | 'ollama'>;
  public readonly model: string;
  private messages: any[];
  private readonly tools = toOpenAITools();

  constructor(private cfg: OpenAISessionConfig) {
    this.provider = cfg.provider;
    this.model = cfg.model;
    this.messages = [{ role: 'system', content: cfg.systemInstruction }, ...toOpenAIMessages(cfg.turns)];
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const endpoint = `${this.cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const body: Record<string, unknown> = {
      model: this.model,
      messages: this.messages,
      stream: true,
      tools: this.tools,
      tool_choice: opts.allowTools ? 'auto' : 'none'
    };
    if (!FIXED_TEMPERATURE_MODELS.test(this.model)) body.temperature = this.cfg.temperature;
    else if (this.cfg.reasoningEffort) body.reasoning_effort = this.cfg.reasoningEffort === 'off' ? 'low' : this.cfg.reasoningEffort;

    const label = this.provider === 'ollama' ? `Ollama (${this.model})` : `OpenAI (${this.model})`;
    const stream = await openStream({
      url: endpoint,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.cfg.apiKey}` },
      body,
      signal,
      label
    });
    if (!stream.res.ok) {
      const errorText = await stream.readAll();
      throw new Error(`${label} API Error (${stream.res.status}): ${errorText.slice(0, 800)}`);
    }

    const splitter = new ThinkTagSplitter();
    const pending = new Map<number, PendingToolCall>();
    let text = '';
    let thinking = '';
    let finishReason: string | undefined;

    const pushContent = (chunk: string) => {
      const out = splitter.feed(chunk);
      if (out.thinking) { thinking += out.thinking; handlers.onThinking(out.thinking); }
      if (out.text) { text += out.text; handlers.onText(out.text); }
    };
    const pushThinking = (chunk: string) => { thinking += chunk; handlers.onThinking(chunk); };
    const collectToolCalls = (calls: any[]) => {
      calls.forEach((tc: any, position: number) => {
        const index = typeof tc.index === 'number' ? tc.index : position;
        const entry = pending.get(index) || { id: '', name: '', args: '' };
        if (tc.id) entry.id = tc.id;
        if (tc.function?.name) entry.name += tc.function.name;
        if (tc.function?.arguments) {
          entry.args += typeof tc.function.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function.arguments);
        }
        pending.set(index, entry);
      });
    };

    const contentType = stream.res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = JSON.parse(await stream.readAll());
      const msg = data.choices?.[0]?.message || {};
      finishReason = data.choices?.[0]?.finish_reason;
      if (msg.reasoning_content || msg.reasoning) pushThinking(msg.reasoning_content || msg.reasoning);
      if (msg.content) pushContent(msg.content);
      if (Array.isArray(msg.tool_calls)) collectToolCalls(msg.tool_calls);
    } else {
      for await (const data of stream.events()) {
        if (data === '[DONE]') break;
        let chunk: any;
        try { chunk = JSON.parse(data); } catch { continue; }
        if (chunk.error) throw new Error(`${label} stream error: ${chunk.error.message || JSON.stringify(chunk.error)}`);
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        if (choice.finish_reason) finishReason = choice.finish_reason;
        const delta = choice.delta || {};
        const reasoning = delta.reasoning_content ?? delta.reasoning;
        if (typeof reasoning === 'string' && reasoning) pushThinking(reasoning);
        if (typeof delta.content === 'string' && delta.content) pushContent(delta.content);
        if (Array.isArray(delta.tool_calls)) collectToolCalls(delta.tool_calls);
      }
    }

    const rest = splitter.flush();
    if (rest.thinking) pushThinking(rest.thinking);
    if (rest.text) { text += rest.text; handlers.onText(rest.text); }

    const toolCalls: ModelToolCall[] = [...pending.entries()]
      .sort(([a], [b]) => a - b)
      .filter(([, tc]) => tc.name)
      .map(([index, tc]) => {
        const id = tc.id || `call_${index}_${Math.random().toString(36).slice(2, 8)}`;
        try {
          return { id, name: tc.name, args: tc.args.trim() ? JSON.parse(tc.args) : {} };
        } catch {
          return { id, name: tc.name, args: {}, argsError: `Invalid JSON arguments: ${tc.args.slice(0, 200)}` };
        }
      });

    this.messages.push({
      role: 'assistant',
      content: text || (toolCalls.length > 0 ? null : ''),
      ...(toolCalls.length > 0
        ? { tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.args) } })) }
        : {})
    });
    return { text, thinking, toolCalls, finishReason };
  }

  public appendToolResults(results: ModelToolResult[]) {
    for (const r of results) {
      this.messages.push({ role: 'tool', tool_call_id: r.id, content: r.failed ? `ERROR: ${r.output}` : r.output });
    }
  }

  public appendUserText(text: string) {
    this.messages.push({ role: 'user', content: text });
  }
}
