import { ToolCallPayload } from './tools';
import { VerificationResult } from './verifier';

export interface AgentMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  toolCalls?: ToolCallPayload[];
  toolResponses?: Array<{ id: string; name: string; output: string }>;
  timestamp: number;
}

export interface RuntimeStepProgress {
  type: 'think' | 'tool' | 'verify' | 'compiler_feedback' | 'done';
  name?: string;
  label: string;
  status: 'running' | 'done' | 'failed';
  timeMs?: number;
  details?: string;
}

export interface AgentState {
  sessionId: string;
  workspaceRoot: string;
  messages: AgentMessage[];
  readFiles: Map<string, { readAt: number; linesCount: number }>;
  modifiedFiles: Set<string>;
  iterationCount: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'verifying' | 'completed' | 'failed' | 'max_iterations_reached';
  lastVerification?: VerificationResult;
}

export interface AgentConfig {
  workspaceRoot: string;
  apiKey: string;
  model?: string;
  maxIterations?: number;
  verificationCommand?: string;
  temperature?: number;
  onStepProgress?: (step: RuntimeStepProgress) => void;
}
