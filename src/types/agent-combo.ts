export type AgentComboFlowType = 'sequential_pipeline' | 'parallel_swarm' | 'lead_delegation';

export interface AgentComboStep {
  id: string;
  subagentId: string;
  stepName: string;
  objective: string;
  recommendedSkills?: string[];
}

export interface AgentCombo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  subagentIds: string[];
  flowType: AgentComboFlowType;
  steps: AgentComboStep[];
  recommendedSkills: string[];
  scope: 'global' | 'workspace' | 'repo';
  targetScopeKey?: string;
  targetScopeFormatted?: string;
  isBuiltin?: boolean;
  updatedAt?: number;
}

export interface RepoComboBinding {
  scopeKey: string;
  comboId: string;
  formattedTag?: string;
  updatedAt: number;
}
