/**
 * Streaming protocol shared by the Electron agent runtime (producer) and the
 * renderer chat UI (consumer). Events are presentation data only: the
 * resolved `ai:sendPrompt` response stays the authoritative result of a run.
 */

export type AgentRunStatus = 'completed' | 'cancelled' | 'failed';

export type AgentMessageStatus = 'streaming' | AgentRunStatus;

export interface AgentStreamToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  label: string;
  turn: number;
  status: 'running' | 'success' | 'failed';
  result?: string;
  executionTimeMs?: number;
}

export type AgentStreamEvent =
  | { type: 'run_started'; model: string; provider: string }
  | { type: 'turn_started'; turn: number; label: string }
  | { type: 'thinking_delta'; turn: number; text: string }
  | { type: 'text_delta'; turn: number; text: string }
  | { type: 'tool_started'; toolCall: AgentStreamToolCall }
  | { type: 'tool_finished'; toolCall: AgentStreamToolCall }
  | { type: 'thought_steered'; turn: number; anomalyType: string; reason: string; correctiveDirective: string }
  | { type: 'synthesis_started'; label: string }
  | { type: 'run_finished'; status: AgentRunStatus; error?: string };

export type AgentStreamEnvelope = AgentStreamEvent & { runId: string; seq: number; at: number };

export type AgentTraceItem =
  | { kind: 'thinking'; id: string; turn: number; text: string; startedAt: number; endedAt?: number }
  | { kind: 'tool'; id: string; turn: number; toolCallId: string }
  | { kind: 'thought_steer'; id: string; turn: number; anomalyType: string; reason: string; correctiveDirective: string; at: number };
