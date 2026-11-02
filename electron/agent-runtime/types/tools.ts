export type RuntimeToolName = 'read_file' | 'patch_file' | 'run_command' | 'list_workspace';

export interface ToolCallPayload {
  id: string;
  name: RuntimeToolName;
  args: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  metadata?: Record<string, any>;
}

export interface ReadFileArgs {
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

export interface CommandRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}
