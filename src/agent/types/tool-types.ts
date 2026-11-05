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

export type ToolName =
  | 'grep_search'
  | 'glob_files'
  | 'read_file_range'
  | 'patch_file'
  | 'run_command'
  | 'git_diff';
