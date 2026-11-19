export type AgentExecutionEnvironment = 'gitbash' | 'powershell' | 'wsl' | 'docker' | 'auto';

export interface EnvironmentInfo {
  id: AgentExecutionEnvironment;
  name: string;
  detected: boolean;
  path: string;
  badge: string;
  versionInfo?: string;
  description?: string;
}

export interface AgentTerminalRunRecord {
  id: string;
  command: string;
  environment: AgentExecutionEnvironment;
  status: 'running' | 'success' | 'failed';
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timestamp: number;
  agentName?: string;
}

export interface TerminalExecutionEnvironmentConfig {
  defaultEnvironment: AgentExecutionEnvironment;
  wslDistro: string;
  dockerImage: string;
  streamToTerminal: boolean;
  sandboxRuntime: 'host_direct' | 'wsl_sandbox' | 'docker_sandbox' | 'dry_run';
}

export const DEFAULT_EXEC_ENV_CONFIG: TerminalExecutionEnvironmentConfig = {
  defaultEnvironment: 'gitbash',
  wslDistro: 'Ubuntu',
  dockerImage: 'node:20-alpine',
  streamToTerminal: true,
  sandboxRuntime: 'host_direct'
};
