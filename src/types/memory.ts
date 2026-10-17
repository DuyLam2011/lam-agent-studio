export type MemoryCategory = 'decision' | 'architecture' | 'convention' | 'gotcha' | 'glossary';

export interface ProjectMemoryItem {
  id: string;
  title: string;
  category: MemoryCategory;
  content: string;
  scope: 'global' | 'workspace' | 'repo';
  targetId?: string;
  pinned: boolean;
  disabledIn?: string[];
  updatedAt?: number;
}
