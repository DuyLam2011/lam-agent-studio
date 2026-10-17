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
  level: 'safe' | 'warning' | 'critical';
  findings: SecurityFinding[];
  sanitizedContent: string;
}

export class SecurityHarnessService {
  private injectionPatterns: Array<{ regex: RegExp; message: string; severity: SecurityFinding['severity'] }> = [
    { regex: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i, message: 'Detected instruction override attack', severity: 'critical' },
    { regex: /(disregard|forget)\s+(all\s+)?(rules|directives|safety)/i, message: 'Detected safety directive bypass attempt', severity: 'critical' },
    { regex: /(you\s+are\s+now|act\s+as)\s+(DAN|jailbroken|unrestricted|god\s*mode)/i, message: 'Detected persona jailbreak pattern', severity: 'high' },
    { regex: /<\/?(system|assistant|user_request|admin)[^>]*>/i, message: 'Detected delimiter smuggling / boundary injection', severity: 'high' },
    { regex: /(developer\s+mode\s+enabled|unfiltered\s+response)/i, message: 'Detected developer mode override attempt', severity: 'medium' },
  ];

  private dangerousCommandPatterns: Array<{ regex: RegExp; message: string; severity: SecurityFinding['severity'] }> = [
    { regex: /rm\s+-rf\s+[\/~]/i, message: 'Destructive root/home directory deletion command', severity: 'critical' },
    { regex: /(format\s+[a-z]:|mkfs\.)/i, message: 'Disk or filesystem formatting command', severity: 'critical' },
    { regex: /del\s+\/[fq]\s+[a-z]:\\/i, message: 'Destructive recursive root drive deletion', severity: 'critical' },
    { regex: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, message: 'Detected shell fork bomb', severity: 'critical' },
    { regex: /(curl|wget)\s+[^\n|]+\|\s*(sh|bash|powershell|cmd)/i, message: 'Unverified remote script pipe execution', severity: 'high' },
    { regex: /(nc\s+-e|bash\s+-i\s+>&\s*\/dev\/tcp)/i, message: 'Reverse shell network execution attempt', severity: 'critical' },
  ];

  private secretPatterns: Array<{ regex: RegExp; message: string }> = [
    { regex: /(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[a-zA-Z0-9_\-]{20,}["']?/i, message: 'Potential hardcoded API key or access token' },
    { regex: /-----BEGIN\s+(RSA|OPENSSH|EC)?\s*PRIVATE\s+KEY-----/, message: 'Private cryptographic key detected in content' },
    { regex: /(cat|type|open)\s+[^\n]*(\.env|id_rsa|id_ed25519)/i, message: 'Sensitive credential file access command' },
  ];

  auditItem(name: string, type: 'rule' | 'skill' | 'mcp' | 'prompt', content: string): SecurityAuditResult {
    const findings: SecurityFinding[] = [];
    let sanitizedContent = content;

    for (const pat of this.injectionPatterns) {
      if (pat.regex.test(content)) {
        findings.push({
          type: 'injection',
          severity: pat.severity,
          message: pat.message,
          suggestion: 'Remove prompt override delimiters and maintain strict compliance with system directives.'
        });
        sanitizedContent = sanitizedContent.replace(pat.regex, '[BLOCKED_INJECTION_PATTERN]');
      }
    }

    for (const pat of this.dangerousCommandPatterns) {
      if (pat.regex.test(content)) {
        findings.push({
          type: 'dangerous_command',
          severity: pat.severity,
          message: pat.message,
          suggestion: 'Replace destructive commands with scoped workspace-safe operations.'
        });
        sanitizedContent = sanitizedContent.replace(pat.regex, '# [DANGEROUS_COMMAND_QUARANTINED]');
      }
    }

    for (const pat of this.secretPatterns) {
      if (pat.regex.test(content)) {
        findings.push({
          type: 'credential_leak',
          severity: 'high',
          message: pat.message,
          suggestion: 'Use environment variables or secure key storage instead of embedding secrets.'
        });
        sanitizedContent = sanitizedContent.replace(pat.regex, '[REDACTED_SECRET]');
      }
    }

    let score = 100;
    findings.forEach(f => {
      if (f.severity === 'critical') score -= 35;
      else if (f.severity === 'high') score -= 20;
      else if (f.severity === 'medium') score -= 10;
      else score -= 5;
    });
    score = Math.max(0, score);

    const level: SecurityAuditResult['level'] = score >= 85 ? 'safe' : score >= 60 ? 'warning' : 'critical';

    return { name, type, score, level, findings, sanitizedContent };
  }

  auditBatch(items: Array<{ name: string; type: 'rule' | 'skill' | 'mcp' | 'prompt'; content: string }>): SecurityAuditResult[] {
    return items.map(item => this.auditItem(item.name, item.type, item.content));
  }
}

export const securityHarnessService = new SecurityHarnessService();
