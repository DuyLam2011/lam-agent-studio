export type ThreatLevel = 'safe' | 'warning' | 'critical';

export interface SecurityFinding {
  type: 'injection' | 'dangerous_command' | 'credential_leak' | 'mcp_privilege' | 'scope_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
}

export interface SecurityAuditResult {
  name: string;
  type: 'rule' | 'skill' | 'mcp' | 'prompt';
  score: number; // 0 - 100
  level: ThreatLevel;
  findings: SecurityFinding[];
  sanitizedContent: string;
}

export interface HarnessSettings {
  enforceStrictDelimiters: boolean;
  sanitizePrompts: boolean;
  blockDangerousCommands: boolean;
  quarantineUntrustedSkills: boolean;
  strictComplianceMode: boolean;
}
