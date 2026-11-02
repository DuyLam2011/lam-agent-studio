export type ToolStrategyType =
  | 'SURGICAL_PATCH'
  | 'WORKSPACE_INSPECT'
  | 'VERIFICATION_RUN'
  | 'ENVIRONMENT_ACTION'
  | 'DIRECT_RESPONSE';

export interface ToolSequenceStep {
  step: number;
  tool: string;
  purpose: string;
  isMandatory: boolean;
}

export interface ToolDecisionState {
  strategy: ToolStrategyType;
  strategyTitle: string;
  strategyDescription: string;
  recommendedPipeline: ToolSequenceStep[];
  prunedTools: string[];
  targetScope?: string;
  confidence: number;
  tokenSavingsEstimate: string;
  computedAt: number;
  rawPrompt?: string;
}

export interface ToolStrategyMeta {
  type: ToolStrategyType;
  title: string;
  description: string;
  defaultPipeline: ToolSequenceStep[];
  disallowedTools: string[];
  badgeColor: string;
}
