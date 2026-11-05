import type { AgentRole, SessionEvent, LLMMessage } from '../types';

export type { AgentRole, SessionEvent, LLMMessage };

/**
 * Filter session events based on agent's perspective.
 * - All Sub-agents see all 'user_request' and 'final_output' events.
 * - 'internal_scratchpad' is strictly visible ONLY to its creator (targetRole).
 */
export const filterEventsForRole = (targetRole: string, events: SessionEvent[]): SessionEvent[] => {
  return events.filter((ev) => {
    if (ev.type === 'user_request' || ev.type === 'final_output') {
      return true;
    }
    if (ev.type === 'internal_scratchpad') {
      return ev.role === targetRole;
    }
    return false;
  });
};

/**
 * Converts filtered events into compliant alternating LLM turns ({ role, parts }).
 * Consecutive turns with the same role are coalesced to prevent 400 Bad Request.
 */
export const buildContextView = (targetRole: string, events: SessionEvent[]): LLMMessage[] => {
  const visible = filterEventsForRole(targetRole, events);
  if (visible.length === 0) return [];

  const rawMessages: LLMMessage[] = [];

  for (const ev of visible) {
    if (ev.role === 'user' || ev.type === 'user_request') {
      rawMessages.push({ role: 'user', parts: [{ text: ev.content }] });
    } else if (ev.role === targetRole) {
      const prefix = ev.type === 'internal_scratchpad' ? '[INTERNAL SCRATCHPAD]:\n' : '';
      rawMessages.push({ role: 'model', parts: [{ text: `${prefix}${ev.content}` }] });
    } else {
      const tag = `[FINAL OUTPUT from ${ev.role.toUpperCase()}]:\n${ev.content}`;
      rawMessages.push({ role: 'user', parts: [{ text: tag }] });
    }
  }

  // Coalesce consecutive messages with the same role
  const coalesced: LLMMessage[] = [];
  for (const msg of rawMessages) {
    const last = coalesced[coalesced.length - 1];
    if (last && last.role === msg.role) {
      last.parts.push(...msg.parts);
    } else {
      coalesced.push({ role: msg.role, parts: [...msg.parts] });
    }
  }

  // Guarantee that conversation begins with a 'user' turn
  if (coalesced.length > 0 && coalesced[0].role !== 'user') {
    coalesced.unshift({
      role: 'user',
      parts: [{ text: `[CONTEXT INITIALIZATION]: Active role: ${targetRole}` }]
    });
  }

  return coalesced;
};
