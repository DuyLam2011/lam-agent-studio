export type SettingCenterTab = 'appearance' | 'terminal' | 'browser' | 'sandbox' | 'ai' | 'commands';

export interface TerminalPermissionConfig {
  executionMode: 'restricted' | 'guarded' | 'turbo';
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
}

export interface AgentPermissionsSettings {
  terminal: TerminalPermissionConfig;
  browser: BrowserPermissionConfig;
  sandbox: SandboxSecurityConfig;
}
