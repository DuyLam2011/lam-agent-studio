import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { useAgentRunStore } from '../../store/useAgentRunStore';
import type { AgentStreamEnvelope } from '../../types/agent-stream';
import { applyAgentEvent } from './agentEventReducer';
import { aiBenchmarkTelemetry } from '../aiBenchmarkTelemetry';

/** Adaptive batch window for streamed deltas; balances 60fps smoothness and CPU overhead. */
const BASE_FLUSH_INTERVAL_MS = 35;
const FLOOD_FLUSH_INTERVAL_MS = 50;

const liveMessages = new Map<string, ChatMessage>();
const queue: AgentStreamEnvelope[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;

const phaseLabelFor = (ev: AgentStreamEnvelope): string | null => {
  switch (ev.type) {
    case 'turn_started': return ev.label;
    case 'tool_started': return ev.toolCall.label;
    case 'synthesis_started': return ev.label;
    case 'text_delta': return 'Writing response...';
    default: return null;
  }
};

const updateMessagesOptimized = (current: ChatMessage[], byId: Map<string, ChatMessage>): ChatMessage[] => {
  if (current.length === 0 || byId.size === 0) return current;
  const last = current[current.length - 1];
  if (byId.size === 1 && last && byId.has(last.id)) {
    const next = current.slice();
    next[next.length - 1] = byId.get(last.id)!;
    return next;
  }
  return current.map((m) => byId.get(m.id) ?? m);
};

const flush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (queue.length === 0) return;

  const touched = new Set<string>();
  const { setPhaseLabel } = useAgentRunStore.getState();
  for (const ev of queue.splice(0)) {
    const msg = liveMessages.get(ev.runId);
    if (!msg) continue;
    if (ev.type === 'text_delta' && ev.text) {
      aiBenchmarkTelemetry.recordToken(ev.runId, ev.text.length);
    }
    liveMessages.set(ev.runId, applyAgentEvent(msg, ev));
    touched.add(ev.runId);
    const label = phaseLabelFor(ev);
    if (label) setPhaseLabel(ev.runId, label);
  }
  if (touched.size === 0) return;

  const byId = new Map<string, ChatMessage>();
  touched.forEach((runId) => {
    const msg = liveMessages.get(runId);
    if (msg) byId.set(msg.id, msg);
  });

  useAgentStore.setState((s) => ({
    chatMessages: updateMessagesOptimized(s.chatMessages, byId),
  }));
};

export const ensureAgentEventBridge = () => {
  if (unsubscribe || typeof window === 'undefined') return;
  unsubscribe = window.lamApi?.ai?.onAgentEvent?.((ev: AgentStreamEnvelope) => {
    if (!ev?.runId || !liveMessages.has(ev.runId)) return;
    queue.push(ev);
    const interval = queue.length > 8 ? FLOOD_FLUSH_INTERVAL_MS : BASE_FLUSH_INTERVAL_MS;
    if (!flushTimer) flushTimer = setTimeout(flush, interval);
  }) ?? null;
};

export const registerLiveMessage = (runId: string, msg: ChatMessage) => {
  liveMessages.set(runId, msg);
  aiBenchmarkTelemetry.startTask(runId);
};

export const getLiveMessage = (runId: string): ChatMessage | undefined => liveMessages.get(runId);

/** Apply every pending event for the run, then stop tracking it. */
export const releaseLiveMessage = (runId: string): ChatMessage | undefined => {
  flush();
  const msg = liveMessages.get(runId);
  liveMessages.delete(runId);
  aiBenchmarkTelemetry.finishTask(runId);
  return msg;
};
