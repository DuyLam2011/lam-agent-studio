export type ArchitectArtifactType = 'rule' | 'skill';
export type AgentDecisionLevel = 'autonomous' | 'balanced' | 'inquisitive' | 'rigorous';

export interface DecisionOption {
  key: string;
  label: string;
  description: string;
  recommended?: boolean;
}

export interface DecisionQuestion {
  id: string;
  question: string;
  category: 'scope' | 'strictness' | 'triggers' | 'negative_constraints';
  options: DecisionOption[];
  selectedOptionKey?: string;
  customAnswer?: string;
}

// Backward-compatibility aliases
export type GrillMeOption = DecisionOption;
export type GrillMeQuestion = DecisionQuestion;

export interface ArchitectContext {
  targetType: ArchitectArtifactType;
  userPrompt: string;
  workspaceId?: string;
  workspaceName?: string;
  repoPath?: string;
  repoName?: string;
  gitDiffSnippet?: string;
  targetFileName?: string;
}

export interface ArchitectSynthesisResult {
  title: string;
  content: string;
  folderName?: string;
  summary: string;
  rationale: string;
}
