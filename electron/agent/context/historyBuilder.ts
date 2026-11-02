import type { HistoryEntry } from '../types';

export interface NormalizedTurn {
  role: 'user' | 'model';
  text: string;
}

/** Character budget for prior turns (an estimate; tokens vary by language). */
const HISTORY_CHAR_BUDGET = 48_000;
const PER_MESSAGE_LIMIT = 8_000;

const toRole = (role: string): 'user' | 'model' =>
  role === 'agent' || role === 'assistant' || role === 'model' ? 'model' : 'user';

const clipMessage = (text: string) =>
  text.length <= PER_MESSAGE_LIMIT ? text : `${text.slice(0, PER_MESSAGE_LIMIT)}\n… [earlier message truncated]`;

/**
 * Turn UI history into an alternating user/model transcript that ends with the
 * current user message, keeps the newest turns within the budget, and carries
 * compact tool outcomes so follow-up questions can reuse earlier findings.
 */
export const normalizeHistory = (history: HistoryEntry[] = [], currentUserText: string): NormalizedTurn[] => {
  const items: NormalizedTurn[] = [];
  for (const msg of history) {
    if (msg.role === 'system') continue;
    const body = (msg.text || '').trim();
    const tools = msg.toolSummary?.trim();
    if (!body && !tools) continue;
    const text = tools ? `${clipMessage(body)}\n\n[Tool outcomes from this turn]\n${tools}` : clipMessage(body);
    items.push({ role: toRole(msg.role), text });
  }

  const last = items[items.length - 1];
  if (last && last.role === 'user' && last.text === currentUserText) items.pop();

  const kept: NormalizedTurn[] = [];
  let used = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    used += items[i].text.length;
    if (used > HISTORY_CHAR_BUDGET) break;
    kept.unshift(items[i]);
  }
  kept.push({ role: 'user', text: currentUserText });

  while (kept.length > 1 && kept[0].role !== 'user') kept.shift();

  const merged: NormalizedTurn[] = [];
  for (const item of kept) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === item.role) prev.text += `\n\n${item.text}`;
    else merged.push({ ...item });
  }
  return merged;
};

export const toGeminiContents = (turns: NormalizedTurn[]) =>
  turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));

export const toOpenAIMessages = (turns: NormalizedTurn[]) =>
  turns.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text }));
