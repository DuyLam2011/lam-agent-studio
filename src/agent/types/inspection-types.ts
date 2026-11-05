export interface ProjectVerificationResult {
  success: boolean;
  errors: string;
  commandUsed: string;
  toolchain: 'typescript' | 'nextjs' | 'npm-script' | 'none';
}

export interface GitStatusSummary {
  hasChanges: boolean;
  staged: string[];
  modified: string[];
  untracked: string[];
  diffStat: string;
  rawStatus: string;
}

export interface AgentFileDiffSnapshot {
  filePath: string;
  relativePath: string;
  originalContent: string;
  newContent: string;
  linesAdded: number;
  linesRemoved: number;
}
