export type RuleScopeType = 'all' | 'global' | 'workspace' | 'repo';

export interface RuleScope {
  type: RuleScopeType;
  workspaceId?: string;
  repoPath?: string;
}

export interface AgentRule {
  id: string;
  name: string;
  description: string;
  content: string;
  scope: 'global' | 'workspace' | 'repo';
  targetId?: string; // workspaceId if workspace, repoPath if repo
  source: 'file' | 'custom' | 'ai-generated';
  filePath?: string;
  active: boolean;
  isOverride?: boolean;
  disabledIn?: string[];
  updatedAt?: number;
}

export interface DetectedRepoRuleFile {
  name: string;
  filePath: string;
  content: string;
  size: number;
  repoPath: string;
  workspaceId: string;
}
