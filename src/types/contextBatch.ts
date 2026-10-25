export type SubagentDomain = 'log' | 'ui' | 'mcp' | 'qa' | 'security' | 'code';

export interface LogContextItem {
  timestamp: number;
  source: 'terminal' | 'build' | 'runtime' | 'test';
  content: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  filePath?: string;
  lineNumber?: number;
}

export interface UIContextItem {
  componentName?: string;
  themeMode: 'dark' | 'light' | 'system';
  themeStyle: 'glassmorphism' | 'minimalism';
  activeTokens: Record<string, string>;
  complianceScore?: number;
  detectedAnomalies?: string[];
}

export interface MCPContextItem {
  serverId: string;
  serverName: string;
  tools: string[];
  status: 'connected' | 'error' | 'disconnected';
}

export interface TestReviewContextItem {
  testSuiteName?: string;
  passed: number;
  failed: number;
  diffSummary?: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  reviewNotes?: string[];
}

export interface SecurityContextItem {
  auditType: 'command' | 'code' | 'secret' | 'pentest';
  passed: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  remediation?: string;
}

export interface ContextBatch {
  id: string;
  timestamp: number;
  workspacePath: string;
  logs: LogContextItem[];
  ui: UIContextItem;
  mcp: MCPContextItem[];
  testReview: TestReviewContextItem;
  security: SecurityContextItem[];
  summary: string;
  tokenCount: number;
}
