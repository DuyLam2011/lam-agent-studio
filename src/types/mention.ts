export type MentionType = 'file' | 'folder' | 'git' | 'terminal' | 'diagnostics' | 'workspace' | 'agent' | 'browser' | 'combo';

export interface MentionItem {
  id: string;
  name: string;
  path: string;
  relativePath?: string;
  rootPath?: string;
  workspaceRepoTag?: string;
  type: MentionType;
  description?: string;
  badge?: string;
  tokenEstimate?: number;
}
