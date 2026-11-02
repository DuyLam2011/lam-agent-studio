import type { ChatMessage, ToolCallItem } from '../../store/useAgentStore';

export interface HistoryPayloadEntry {
  role: 'user' | 'agent';
  text: string;
  toolSummary?: string;
}

/** Recent messages sent to the engine; the engine applies the character budget. */
const MAX_HISTORY_MESSAGES = 30;
const RESULT_PREVIEW = 160;

const toolTarget = (tc: ToolCallItem): string => {
  const a = tc.args || {};
  return String(a.path || a.filePath || a.command || a.query || '').slice(0, 120);
};

const summarizeTool = (tc: ToolCallItem): string => {
  const mark = tc.status === 'failed' ? '✗' : '✓';
  const target = toolTarget(tc);
  const head = `${mark} ${tc.name}${target ? `(${target})` : ''}`;
  const result = typeof tc.result === 'string' ? tc.result : tc.result != null ? JSON.stringify(tc.result) : '';
  if (!result) return head;
  const preview = result.replace(/\s+/g, ' ').slice(0, RESULT_PREVIEW);
  return `${head}: ${preview}${result.length > RESULT_PREVIEW ? '…' : ''}`;
};

export const summarizeToolOutcomes = (msg: ChatMessage): string | undefined => {
  const lines = (msg.toolCalls || []).map(summarizeTool);
  for (const d of msg.diffSnapshots || []) lines.push(`changed ${d.relativePath} (+${d.linesAdded}/-${d.linesRemoved})`);
  return lines.length > 0 ? lines.join('\n') : undefined;
};

/**
 * Build the prior-turn transcript for the engine from completed messages only.
 * Streaming placeholders and empty replies are skipped so a cancelled or
 * in-flight turn never leaks partial text into the next request.
 */
export const buildHistoryPayload = (messages: ChatMessage[]): HistoryPayloadEntry[] => {
  const usable = messages.filter((m) => {
    if (m.role === 'system' || m.status === 'streaming') return false;
    return Boolean(m.text?.trim()) || Boolean(m.toolCalls?.length);
  });
  return usable.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role === 'user' ? 'user' : 'agent',
    text: m.status === 'cancelled' && m.text ? `${m.text}\n\n[This reply was stopped by the user before completion.]` : m.text,
    toolSummary: m.role === 'user' ? undefined : summarizeToolOutcomes(m)
  }));
};
