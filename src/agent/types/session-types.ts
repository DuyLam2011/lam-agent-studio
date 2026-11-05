export type AgentRole = 'user' | 'father' | 'scout' | 'architect' | 'engineer' | 'reviewer';

export type SessionEventType = 'user_request' | 'internal_scratchpad' | 'final_output';

export interface SessionEvent {
  id: string;
  role: AgentRole;
  type: SessionEventType;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LLMMessagePart {
  text: string;
}

export interface LLMMessage {
  role: 'user' | 'model';
  parts: LLMMessagePart[];
}
