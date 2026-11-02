import type { ChatMessage, ToolCallItem } from '../../store/useAgentStore';
import type { AgentStreamEnvelope, AgentTraceItem } from '../../types/agent-stream';

type ThinkingItem = Extract<AgentTraceItem, { kind: 'thinking' }>;

const closeOpenThinking = (trace: AgentTraceItem[], at: number): AgentTraceItem[] => {
  const last = trace[trace.length - 1];
  if (last?.kind !== 'thinking' || last.endedAt) return trace;
  return [...trace.slice(0, -1), { ...last, endedAt: at }];
};

const toToolItem = (tc: Extract<AgentStreamEnvelope, { type: 'tool_started' | 'tool_finished' }>['toolCall']): ToolCallItem => ({
  id: tc.id,
  name: tc.name,
  args: tc.args,
  status: tc.status,
  result: tc.result,
  executionTimeMs: tc.executionTimeMs,
  label: tc.label,
  turn: tc.turn
});

/**
 * Apply one streamed agent event to the placeholder reply message. Pure and
 * idempotent per event, so batches can be replayed in `seq` order.
 */
export const applyAgentEvent = (msg: ChatMessage, ev: AgentStreamEnvelope): ChatMessage => {
  const trace = msg.trace || [];
  switch (ev.type) {
    case 'run_started':
      return { ...msg, model: ev.model };

    case 'thinking_delta': {
      const last = trace[trace.length - 1];
      if (last?.kind === 'thinking' && !last.endedAt && last.turn === ev.turn) {
        const updated: ThinkingItem = { ...last, text: last.text + ev.text };
        return { ...msg, thinking: (msg.thinking || '') + ev.text, trace: [...trace.slice(0, -1), updated] };
      }
      const item: ThinkingItem = { kind: 'thinking', id: `th-${ev.runId}-${ev.seq}`, turn: ev.turn, text: ev.text, startedAt: ev.at };
      const thinking = msg.thinking ? `${msg.thinking}\n\n${ev.text}` : ev.text;
      return { ...msg, thinking, trace: [...closeOpenThinking(trace, ev.at), item] };
    }

    case 'text_delta':
      return { ...msg, text: msg.text + ev.text, trace: closeOpenThinking(trace, ev.at) };

    case 'tool_started': {
      const toolCalls = [...(msg.toolCalls || []).filter((t) => t.id !== ev.toolCall.id), toToolItem(ev.toolCall)];
      const toolItem: AgentTraceItem = { kind: 'tool', id: `tr-${ev.toolCall.id}`, turn: ev.toolCall.turn, toolCallId: ev.toolCall.id };
      return { ...msg, toolCalls, trace: [...closeOpenThinking(trace, ev.at), toolItem] };
    }

    case 'tool_finished':
      return {
        ...msg,
        toolCalls: (msg.toolCalls || []).map((t) => (t.id === ev.toolCall.id ? { ...t, ...toToolItem(ev.toolCall) } : t))
      };

    case 'thought_steered': {
      const steerItem: AgentTraceItem = {
        kind: 'thought_steer',
        id: `steer-${ev.runId}-${ev.seq}`,
        turn: ev.turn,
        anomalyType: ev.anomalyType,
        reason: ev.reason,
        correctiveDirective: ev.correctiveDirective,
        at: ev.at
      };
      return { ...msg, trace: [...closeOpenThinking(trace, ev.at), steerItem] };
    }

    case 'run_finished':
      return { ...msg, status: ev.status, error: ev.error, trace: closeOpenThinking(trace, ev.at) };

    default:
      return msg;
  }
};

/**
 * Merge the authoritative IPC response into the streamed message. The streamed
 * trace is kept for presentation; text, tools and diffs come from the response.
 */
export const finalizeAgentMessage = (streamed: ChatMessage, final: Partial<ChatMessage>, startedAt: number): ChatMessage => {
  const status = final.status || (streamed.status === 'streaming' ? 'completed' : streamed.status) || 'completed';
  const streamedTools = new Map((streamed.toolCalls || []).map((t) => [t.id, t]));
  const toolCalls = final.toolCalls?.map((t) => ({ ...streamedTools.get(t.id), ...t })) ?? streamed.toolCalls;
  return {
    ...streamed,
    ...final,
    id: streamed.id,
    text: final.text ?? streamed.text,
    thinking: streamed.thinking || final.thinking,
    toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
    trace: closeOpenThinking(streamed.trace || [], Date.now()),
    status,
    durationMs: final.durationMs ?? Date.now() - startedAt
  };
};
