export interface ReadFileRangeArgs {
  filePath: string;
  startLine?: number;
  endLine?: number;
}

export interface PatchFileArgs {
  filePath: string;
  oldContent: string;
  newContent: string;
}

export interface RunCommandArgs {
  command: string;
  timeoutMs?: number;
}

export interface ListWorkspaceArgs {
  dirPath?: string;
  maxDepth?: number;
}

export interface ToolResult<T = any> {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  metadata?: T;
}

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

export interface AgentLoopOptions {
  apiKey?: string;
  model?: string;
  maxIterations?: number;
  systemPrompt?: string;
  verificationCommand?: string;
}

export interface AgentStepRecord {
  step: number;
  action: string;
  target?: string;
  output?: string;
  error?: string;
  verification?: ProjectVerificationResult;
  gitStatus?: GitStatusSummary;
}

export interface AgentFinalResult {
  success: boolean;
  finalAnswer: string;
  totalIterations: number;
  history: AgentStepRecord[];
  verifiedClean: boolean;
  gitStatus?: GitStatusSummary;
  diffSnapshots: AgentFileDiffSnapshot[];
}
