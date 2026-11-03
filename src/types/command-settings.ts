export type SupportedModelFamily = 'claude' | 'gemini' | 'openai' | 'local-ollama' | 'auto';

export type CommandChainingStyle = 'atomic-single' | 'chained-safe' | 'pipeline-multistep';

export type CommandRiskTier = 'low' | 'medium' | 'high' | 'critical';

export interface ModelCommandRule {
  modelFamily: SupportedModelFamily;
  label: string;
  description: string;
  maxOutputLines: number;
  timeoutMs: number;
  recommendedShellPrefix: string;
  nonInteractiveEnforced: boolean;
  pipeOutputLimit: boolean;
  chainingStyle: CommandChainingStyle;
  guidelines: string[];
}

export interface WorkspaceFolderCommandSetting {
  workspaceId: string;
  repoPath: string;
  defaultSubfolder: string;
  lastUsedFolder: string;
  folderAliases: Record<string, string>;
  updatedAt: number;
}

export interface CommandExecutionPolicy {
  activeModelFamily: SupportedModelFamily;
  defaultWorkingDir: string;
  autoApproveSafeCommands: boolean;
  safeguardConfirmationRequired: boolean;
  truncateLongOutputs: boolean;
  outputLineLimit: number;
  customEnvVars: Record<string, string>;
  workspaceFolders: Record<string, WorkspaceFolderCommandSetting>;
}

export interface CommandAdvisoryRequest {
  userIntent: string;
  modelId?: string;
  modelFamily?: SupportedModelFamily;
  activeWorkspaceId?: string;
  activeRepoPath?: string;
  requestedSubfolder?: string;
}

export interface CommandAdvisoryResult {
  recommendedCommand: string;
  tailoredForModel: SupportedModelFamily;
  targetWorkingDir: string;
  isSafeguardRequired: boolean;
  safeguardReason?: string;
  riskTier: CommandRiskTier;
  modelSpecificNotes: string[];
}
