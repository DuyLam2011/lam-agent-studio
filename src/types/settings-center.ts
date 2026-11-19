import { AgentExecutionEnvironment } from './execution-environment';

export type SettingCenterTab = 'appearance' | 'terminal' | 'browser' | 'sandbox' | 'ai' | 'commands';
export type AgentDecisionLevel = 'autonomous' | 'balanced' | 'inquisitive' | 'rigorous';

export interface TerminalPermissionConfig {
  executionMode: 'restricted' | 'guarded' | 'turbo';
  defaultEnvironment?: AgentExecutionEnvironment;
  wslDistro?: string;
  dockerImage?: string;
  streamToTerminal?: boolean;
  allowedCommands: string[];
  blockedCommands: string[];
  requireConfirmation: string[];
}

export interface BrowserPermissionConfig {
  enabled: boolean;
  allowedDomains: string[];
  captureScreenshots: boolean;
  allowDomClick: boolean;
}

export interface SandboxSecurityConfig {
  sandboxStrict: boolean;
  quarantinePatterns: string[];
  maxFileSizeBytes: number;
  isolateScripts: boolean;
  blockOutboundLinks: boolean;
  allowedOutboundDomains: string[];
  stripSensitiveEnvInSandbox: boolean;
  sandboxTimeoutMs: number;
  sandboxRuntime?: 'host_direct' | 'wsl_sandbox' | 'docker_sandbox' | 'dry_run';
}

export interface AgentPermissionsSettings {
  terminal: TerminalPermissionConfig;
  browser: BrowserPermissionConfig;
  sandbox: SandboxSecurityConfig;
}
