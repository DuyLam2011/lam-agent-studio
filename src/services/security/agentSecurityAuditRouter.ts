import { SubagentPersona } from '../../types/subagents';

export interface SecurityAuditIntent {
  isSecurityAudit: boolean;
  targetScope?: string;
  auditCategory: 'owasp' | 'secrets' | 'sandbox' | 'dependencies' | 'full';
  recommendedSubagentId: string;
  recommendedSubagentName: string;
  rationale: string;
}

const SECURITY_PATTERNS = [
  /\b(pentest|penetration\s+test|kiểm\s+thử\s+xâm\s+nhập)\b/i,
  /\b(security\s+audit|security\s+review|rà\s+soát\s+an\s+ninh|quét\s+lỗ\s+hổng|audit\s+bảo\s+mật)\b/i,
  /\b(owasp|cve|vulnerab|sql\s+injection|xss|csrf|ssrf|rce|secret\s+leak|token\s+leak|credential\s+leak)\b/i,
  /^\/(pentest|security|security-audit)\b/i
];

export const detectSecurityAuditIntent = (
  text: string,
  availableSubagents: SubagentPersona[] = [],
  taggedSubagentId?: string | null
): SecurityAuditIntent => {
  const isMatch = SECURITY_PATTERNS.some((p) => p.test(text));
  if (!isMatch) {
    return {
      isSecurityAudit: false,
      auditCategory: 'full',
      recommendedSubagentId: 'subagent-security-harness',
      recommendedSubagentName: 'Security Sentinel & Penetration Tester',
      rationale: 'Không phải yêu cầu kiểm thử an ninh/pentest.'
    };
  }

  // Determine specific audit category
  let category: SecurityAuditIntent['auditCategory'] = 'full';
  if (/secret|token|credential|key|rò\s+rỉ|api[-_]?key/i.test(text)) {
    category = 'secrets';
  } else if (/injection|xss|csrf|sqli|command\s+injection/i.test(text)) {
    category = 'owasp';
  } else if (/sandbox|permission|boundary|vượt\s+rào|escape/i.test(text)) {
    category = 'sandbox';
  } else if (/dependency|package|npm\s+audit|cve/i.test(text)) {
    category = 'dependencies';
  }

  // Resolve subagent: Tagged > Security Harness > Architecture Class > Fallback
  let chosen: SubagentPersona | undefined;
  if (taggedSubagentId) {
    chosen = availableSubagents.find((s) => s.id === taggedSubagentId || s.id.includes(taggedSubagentId));
  }

  if (!chosen) {
    chosen = availableSubagents.find(
      (s) => s.id === 'subagent-security-harness' || s.id.includes('security') || s.name.toLowerCase().includes('security')
    );
  }

  if (!chosen) {
    chosen = availableSubagents.find((s) => s.agentClass === 'architecture') || availableSubagents[0];
  }

  const subId = chosen?.id || 'subagent-security-harness';
  const subName = chosen?.name || 'Security Sentinel & Penetration Tester';

  return {
    isSecurityAudit: true,
    auditCategory: category,
    recommendedSubagentId: subId,
    recommendedSubagentName: subName,
    rationale: `Phát hiện yêu cầu Kiểm thử An ninh/Pentest (${category.toUpperCase()}). Chỉ định ${subName} thực thi rà soát Read-Only.`
  };
};
