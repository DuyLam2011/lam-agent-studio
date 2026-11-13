import { toGeminiTools } from '../tools/definitions';
import { openStream } from './streamHttp';
import type { NormalizedTurn } from '../context/historyBuilder';
import { toGeminiContents } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolCall, ModelToolResult, ModelTurnResult, ReasoningEffort } from '../types';

export interface GeminiSessionConfig {
  apiKey: string;
  model: string;
  systemInstruction: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens: number;
  reasoningEffort?: ReasoningEffort;
}

/** Thinking config fidelity; downgraded when a model rejects a field. */
type ThinkingMode = 'tuned' | 'summaries' | 'none';

const BUDGET_BY_EFFORT: Record<ReasoningEffort, number> = { off: 0, low: 1024, medium: 8192, high: -1 };
const modelGen = (model: string) => Number(model.match(/gemini-(\d+)/)?.[1] || 0);

const buildThinkingConfig = (model: string, effort: ReasoningEffort | undefined, mode: ThinkingMode) => {
  if (mode === 'none') return undefined;
  const config: Record<string, unknown> = { includeThoughts: effort !== 'off' };
  if (mode === 'tuned' && effort) {
    if (modelGen(model) >= 3) config.thinkingLevel = effort === 'off' ? 'low' : effort;
    else config.thinkingBudget = BUDGET_BY_EFFORT[effort];
  }
  return config;
};

const PUBLIC_GEMINI_REMAP: Record<string, string> = {
  'gemini-3.5-flash-lite': 'gemini-2.5-flash',
  'gemini-3.8-flash': 'gemini-2.5-flash',
  'gemini-3.8-flash-high': 'gemini-2.5-flash',
  'gemini-flash-lite-latest': 'gemini-2.0-flash'
};

export const resolveGeminiModel = (raw?: string) => PUBLIC_GEMINI_REMAP[(raw || 'gemini-2.5-flash').replace(/^models\//, '')] || (raw || 'gemini-2.5-flash').replace(/^models\//, '');

export class GeminiSession implements ModelSession {
  public readonly provider = 'gemini' as const;
  public model: string;
  private contents: any[];
  private thinkingMode: ThinkingMode = 'tuned';
  private has503Retried = false;
  private readonly tools = toGeminiTools();

  constructor(private cfg: GeminiSessionConfig) {
    this.model = resolveGeminiModel(cfg.model);
    this.contents = toGeminiContents(cfg.turns);
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.cfg.apiKey}`;
    const thinkingConfig = buildThinkingConfig(this.model, this.cfg.reasoningEffort, this.thinkingMode);
    const body = {
      contents: this.contents,
      systemInstruction: { parts: [{ text: this.cfg.systemInstruction }] },
      tools: this.tools,
      toolConfig: { functionCallingConfig: { mode: opts.allowTools ? 'AUTO' : 'NONE' } },
      generationConfig: {
        ...(this.cfg.temperature !== undefined && modelGen(this.model) < 3 ? { temperature: this.cfg.temperature } : {}),
        maxOutputTokens: this.cfg.maxOutputTokens,
        ...(thinkingConfig ? { thinkingConfig } : {})
      }
    };

    const stream = await openStream({ url, headers: { 'Content-Type': 'application/json' }, body, signal, label: `Gemini (${this.model})` });
    if (!stream.res.ok) {
      const errorText = await stream.readAll();
      if (stream.res.status === 400 && this.thinkingMode !== 'none' && /think/i.test(errorText)) {
        this.thinkingMode = this.thinkingMode === 'tuned' ? 'summaries' : 'none';
        return this.streamTurn(handlers, signal, opts);
      }
      if (stream.res.status === 503 && !this.has503Retried && this.model !== 'gemini-2.0-flash') {
        this.has503Retried = true;
        this.model = 'gemini-2.0-flash';
        return this.streamTurn(handlers, signal, opts);
      }
      const msg = stream.res.status === 503
        ? 'Gemini API Error (503): Model high demand spikes. Switch to Google Antigravity Engine or try again later.'
        : `Gemini API Error (${stream.res.status}): ${errorText.slice(0, 500)}`;
      throw new Error(msg);
    }

    const modelParts: any[] = [];
    const toolCalls: ModelToolCall[] = [];
    let text = '';
    let thinking = '';
    let finishReason: string | undefined;

    for await (const data of stream.events()) {
      let chunk: any;
      try { chunk = JSON.parse(data); } catch { continue; }
      if (chunk.promptFeedback?.blockReason) throw new Error(`Gemini blocked the request: ${chunk.promptFeedback.blockReason}`);
      const candidate = chunk.candidates?.[0];
      if (!candidate) continue;
      if (candidate.finishReason) finishReason = candidate.finishReason;

      for (const part of candidate.content?.parts || []) {
        if (part.functionCall) {
          modelParts.push(part);
          toolCalls.push({
            id: part.functionCall.id || `gc-${toolCalls.length}-${Math.random().toString(36).slice(2, 8)}`,
            name: part.functionCall.name,
            args: part.functionCall.args || {}
          });
        } else if (part.thought) {
          if (part.text) { thinking += part.text; handlers.onThinking(part.text); }
          if (part.thoughtSignature) modelParts.push({ thought: true, thoughtSignature: part.thoughtSignature, text: part.text || '' });
        } else if (typeof part.text === 'string') {
          text += part.text;
          if (part.text) handlers.onText(part.text);
          const last = modelParts[modelParts.length - 1];
          if (!part.thoughtSignature && last && typeof last.text === 'string' && !last.thought && !last.thoughtSignature && !last.functionCall) {
            last.text += part.text;
          } else {
            modelParts.push({ ...part });
          }
        }
      }
    }

    if (modelParts.length > 0) this.contents.push({ role: 'model', parts: modelParts });
    return { text, thinking, toolCalls, finishReason };
  }

  public appendToolResults(results: ModelToolResult[]) {
    this.contents.push({
      role: 'user',
      parts: results.map((r) => ({
        functionResponse: {
          ...(r.id.startsWith('gc-') ? {} : { id: r.id }),
          name: r.name,
          response: r.failed ? { error: r.output } : { output: r.output }
        }
      }))
    });
  }

  public appendUserText(text: string) {
    const last = this.contents[this.contents.length - 1];
    if (last?.role === 'user') last.parts.push({ text });
    else this.contents.push({ role: 'user', parts: [{ text }] });
  }
}
