export type AuditVerdict = 'SAFE' | 'WARNING' | 'DANGEROUS' | 'REJECTED';

export type AuditFindingCategory =
  | 'SECURITY_INJECTION'
  | 'MALICIOUS_COMMAND'
  | 'CREDENTIAL_LEAK'
  | 'CONTEXT_BLOAT'
  | 'FORMAT_COMPLIANCE';

export interface AuditFinding {
  id: string;
  category: AuditFindingCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  matchedSnippet?: string;
  remediation?: string;
}

export interface ResourceAuditReport {
  resourceName: string;
  resourceType: string;
  verdict: AuditVerdict;
  safetyScore: number; // 0 - 100
  estimatedTokens: number;
  findings: AuditFinding[];
  sanitizedContent?: string;
  canInstallSafely: boolean;
  auditedAt: number;
  summaryText: string;
}
