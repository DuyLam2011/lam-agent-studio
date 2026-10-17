export type SkillScopeType = 'global' | 'workspace' | 'repo';

export interface SkillScope {
  type: SkillScopeType;
  workspaceId?: string;
  repoPath?: string;
}

export interface AgentSkill {
  id: string;
  name: string;
  folderName: string;
  description: string;
  content: string;
  scope: SkillScopeType;
  targetId?: string; // workspaceId if workspace, repoPath if repo
  source: 'builtin' | 'file' | 'custom' | 'ai-generated';
  filePath?: string; // Path to SKILL.md
  active: boolean;
  category?: 'workflow' | 'testing' | 'security' | 'architecture' | 'devops' | 'code-quality' | 'general';
  icon?: string;
  disabledIn?: string[];
  updatedAt?: number;
}

export interface DetectedRepoSkillFile {
  name: string;
  folderName: string;
  description: string;
  filePath: string;
  content: string;
  size: number;
  repoPath: string;
  workspaceId: string;
}

export interface AiSkillRecommendation {
  id: string;
  name: string;
  folderName: string;
  category: 'workflow' | 'testing' | 'security' | 'architecture' | 'devops' | 'code-quality';
  description: string;
  rationale: string;
  suggestedContent: string;
}
