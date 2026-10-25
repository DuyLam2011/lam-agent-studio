export type MentionType = 'file' | 'git' | 'terminal' | 'diagnostics' | 'workspace';

export interface MentionItem {
  id: string;
  name: string;
  path: string;
  type: MentionType;
  description?: string;
  badge?: string;
  tokenEstimate?: number;
}
