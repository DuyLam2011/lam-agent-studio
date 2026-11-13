export type ArchitectArtifactType = 'rule' | 'skill';

export interface GrillMeOption {
  key: string;
  label: string;
  description: string;
  recommended?: boolean;
}

export interface GrillMeQuestion {
  id: string;
  question: string;
  category: 'scope' | 'strictness' | 'triggers' | 'negative_constraints';
  options: GrillMeOption[];
  selectedOptionKey?: string;
  customAnswer?: string;
}

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
