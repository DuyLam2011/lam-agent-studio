import { ProjectVerificationResult, GitStatusSummary, AgentFileDiffSnapshot } from './inspection-types';
import { ToolName } from './tool-types';
import { AgentRole, SessionEvent } from './session-types';

export interface AgentLoopOptions {
  apiKey?: string;
  model?: string;
  maxIterations?: number;
  systemPrompt?: string;
  verificationCommand?: string;
}

export interface AgentStepRecord {
  step: number;
  action: string;
  target?: string;
  output?: string;
  error?: string;
  verification?: ProjectVerificationResult;
  gitStatus?: GitStatusSummary;
}

export interface AgentFinalResult {
  success: boolean;
  finalAnswer: string;
  totalIterations: number;
  history: AgentStepRecord[];
  verifiedClean: boolean;
  gitStatus?: GitStatusSummary;
  diffSnapshots: AgentFileDiffSnapshot[];
}

export type TriageLevel = 1 | 2 | 3;
export type TriageCategory = 'direct' | 'investigative' | 'complex_pipeline';
export type ModelTier = 'Tier-Fast' | 'Tier-Reasoning';

export interface TriageResult {
  level: TriageLevel;
  category: TriageCategory;
  pipeline: AgentRole[];
  rationale: string;
}

export interface ModelTierAllocation {
  tier: ModelTier;
  modelId: string;
  provider: 'gemini' | 'claude' | 'local' | 'antigravity';
}

export type SubAgentRole = 'scout' | 'architect' | 'engineer' | 'reviewer';

export interface ReviewResult {
  status: 'APPROVED' | 'REJECTED';
  issues: string[];
}

export interface SubAgentCapsule {
  role: SubAgentRole;
  title: string;
  allowedTools: readonly ToolName[];
  systemPrompt: string;
  outputContract: string;
}

export interface RuntimeProgressEvent {
  cardId: string;
  stage: AgentRole;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  title: string;
  detail?: string;
  output?: string;
  error?: string;
  timestamp: number;
}

export interface RuntimeOptions {
  apiKey?: string;
  registry?: any;
  onProgress?: (event: RuntimeProgressEvent) => void;
  onSessionEvent?: (event: SessionEvent) => void;
}

export interface RuntimeExecutionResult {
  success: boolean;
  triage: TriageResult;
  sessionEvents: SessionEvent[];
  finalAnswer: string;
  error?: string;
}
