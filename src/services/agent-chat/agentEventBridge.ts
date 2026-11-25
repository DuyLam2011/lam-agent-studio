import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { useAgentRunStore } from '../../store/useAgentRunStore';
import type { AgentStreamEnvelope } from '../../types/agent-stream';
import { applyAgentEvent } from './agentEventReducer';
import { aiBenchmarkTelemetry } from '../benchmark/aiBenchmarkTelemetry';

/** Display-synchronized 60fps refresh window for buttery-smooth token streaming without timer jitter. */
const MIN_FRAME_INTERVAL_MS = 16;

const liveMessages = new Map<string, ChatMessage>();
const queue: AgentStreamEnvelope[] = [];
let rafId: number | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastFlushTime = 0;
let unsubscribe: (() => void) | null = null;

const phaseLabelFor = (ev: AgentStreamEnvelope): string | null => {
  switch (ev.type) {
    case 'turn_started': return ev.label;
    case 'thinking_delta': return 'Synthesizing reasoning trace...';
    case 'tool_started': return ev.toolCall.label;
    case 'synthesis_started': return ev.label;
    case 'text_delta': return 'Writing response...';
    case 'run_finished': return ev.status === 'completed' ? 'Completed' : ev.status;
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
  if (rafId !== null) {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (queue.length === 0) return;

  const touched = new Set<string>();
  const { setPhaseLabel } = useAgentRunStore.getState();
  const latestLabels = new Map<string, string>();
  for (const ev of queue.splice(0)) {
    const msg = liveMessages.get(ev.runId);
    if (!msg) continue;
    if (ev.type === 'text_delta' && ev.text) {
      aiBenchmarkTelemetry.recordToken(ev.runId, ev.text.length);
    }
    liveMessages.set(ev.runId, applyAgentEvent(msg, ev));
    touched.add(ev.runId);
    const label = phaseLabelFor(ev);
    if (label) latestLabels.set(ev.runId, label);
  }
  for (const [runId, label] of latestLabels) {
    setPhaseLabel(runId, label);
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

const scheduleFlush = () => {
  if (rafId !== null) return;
  if (typeof requestAnimationFrame !== 'undefined') {
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastFlushTime >= MIN_FRAME_INTERVAL_MS || queue.length > 4) {
        lastFlushTime = now;
        flush();
      } else {
        scheduleFlush();
      }
    });
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, 16);
  }
};

export const ensureAgentEventBridge = () => {
  if (unsubscribe || typeof window === 'undefined') return;
  unsubscribe = window.lamApi?.ai?.onAgentEvent?.((ev: AgentStreamEnvelope) => {
    if (!ev?.runId || !liveMessages.has(ev.runId)) return;
    queue.push(ev);
    scheduleFlush();
  }) ?? null;
};

export const registerLiveMessage = (runId: string, msg: ChatMessage) => {
  liveMessages.set(runId, msg);
  aiBenchmarkTelemetry.startTask(runId);
};

export const getLiveMessage = (runId: string): ChatMessage | undefined => liveMessages.get(runId);

export const releaseLiveMessage = (runId: string): ChatMessage | undefined => {
  flush();
  const msg = liveMessages.get(runId);
  liveMessages.delete(runId);
  aiBenchmarkTelemetry.finishTask(runId);
  return msg;
};
