export type MemoryCategory = 'decision' | 'architecture' | 'convention' | 'gotcha' | 'glossary';
export type MemoryStatus = 'accepted' | 'proposed' | 'deprecated' | 'superseded';

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
  filePath?: string;
  status?: MemoryStatus;
  tags?: string[];
  author?: string;
  linkedSymbolsCount?: number;
}

export interface MemoryFolderTreeNode {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size?: number;
  itemCount?: number;
  category?: MemoryCategory;
  children?: MemoryFolderTreeNode[];
}

export interface MemoryStorageStats {
  rootPath: string;
  totalItems: number;
  markdownFilesCount: number;
  categories: Record<MemoryCategory, number>;
  graphIndexed: boolean;
  lastSyncedAt: number;
}
