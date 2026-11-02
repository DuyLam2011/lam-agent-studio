import { AuditFinding, ResourceAuditReport, AuditVerdict } from '../../types/resource-audit';
import { sanitizeResourceContent } from './resourceSanitizer';

export const auditResourceContent = (
  content: string,
  resourceName: string = 'Untitled',
  resourceType: string = 'rule'
): ResourceAuditReport => {
  const findings: AuditFinding[] = [];
  const text = content || '';
  const estTokens = Math.ceil(text.length / 3.8);

  // 1. Check Malicious Destructive Shell Commands
  if (/(?:rm\s+-rf\s+[/~*]|format\s+[a-z]:|drop\s+database|del\s+\/f\s+\/s\s+\/q)/i.test(text)) {
    findings.push({
      id: 'mal-cmd-destructive',
      category: 'MALICIOUS_COMMAND',
      severity: 'critical',
      title: 'Phát hiện lệnh hủy diệt hệ thống',
      description: 'Nội dung chứa lệnh xóa triệt để tệp hoặc định dạng ổ đĩa.',
      remediation: 'Loại bỏ lệnh xóa hoặc chạy qua cơ chế kiểm duyệt cách ly.'
    });
  }

  // 2. Check Pipe to Shell / Remote Code Execution
  if (/(?:curl|wget)\s+[^\n|]+\|\s*(?:sh|bash|zsh|powershell)/i.test(text)) {
    findings.push({
      id: 'mal-cmd-pipe-exec',
      category: 'MALICIOUS_COMMAND',
      severity: 'critical',
      title: 'Tải và thực thi script trực tiếp (Pipe-to-shell)',
      description: 'Lệnh curl/wget truyền trực tiếp vào shell có thể tải payload độc hại.',
      remediation: 'Tách biệt bước tải về và thẩm định mã nguồn trước khi cấp quyền chạy.'
    });
  }

  // 3. Check Adversarial Prompt Injection & System Override
  if (/(?:ignore\s+(?:all\s+)?previous\s+instructions|system\s+prompt\s+override|disregard\s+(?:all\s+)?prior\s+rules|jailbreak)/i.test(text)) {
    findings.push({
      id: 'sec-prompt-injection',
      category: 'SECURITY_INJECTION',
      severity: 'high',
      title: 'Cố gắng chèn Prompt Injection hoặc ghi đè System Prompt',
      description: 'Chỉ thị chứa cụm từ ép buộc mô hình bỏ qua quy chuẩn an toàn đã thiết lập.',
      remediation: 'Vô hiệu hóa chỉ thị ghi đè hệ thống hoặc khử độc (sanitize).'
    });
  }

  // 4. Check Credential & Secret Harvesting
  if (/(?:\.env\b|id_rsa|\.aws\/credentials|ghp_[a-zA-Z0-9]{36}|BEGIN (?:RSA )?PRIVATE KEY)/i.test(text)) {
    findings.push({
      id: 'sec-cred-leak',
      category: 'CREDENTIAL_LEAK',
      severity: 'high',
      title: 'Phát hiện truy cập tệp chứa khóa bí mật hoặc Token nhạy cảm',
      description: 'Tài nguyên có hành vi đọc tệp .env, private key hoặc chứa token cứng.',
      remediation: 'Sử dụng biến môi trường an toàn thay vì hardcode token.'
    });
  }

  // 5. Check Token Bloat
  if (estTokens > 3500) {
    findings.push({
      id: 'ctx-bloat-large',
      category: 'CONTEXT_BLOAT',
      severity: estTokens > 7000 ? 'high' : 'medium',
      title: `Tài nguyên có kích thước lớn (~${estTokens} tokens)`,
      description: 'Kích thước vượt ngưỡng khuyến nghị có thể làm loãng attention và tăng chi phí token.',
      remediation: 'Chia nhỏ tài nguyên thành các skill hoặc rules con.'
    });
  }

  // 6. Check Format & Schema Compliance
  if (resourceType === 'skill' && !/---[\s\S]*?name:[\s\S]*?description:[\s\S]*?---/i.test(text) && !/^#\s+/m.test(text)) {
    findings.push({
      id: 'fmt-skill-frontmatter',
      category: 'FORMAT_COMPLIANCE',
      severity: 'low',
      title: 'Thiếu chuẩn YAML frontmatter trong SKILL.md',
      description: 'Tài nguyên skill nên có trường name và description ở đầu tệp.',
      remediation: 'Bổ sung khối YAML metadata ở dòng đầu tiên.'
    });
  }

  // Calculate Safety Score & Verdict
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'critical') score -= 40;
    else if (f.severity === 'high') score -= 25;
    else if (f.severity === 'medium') score -= 15;
    else if (f.severity === 'low') score -= 5;
  }
  score = Math.max(0, Math.min(100, score));

  let verdict: AuditVerdict = 'SAFE';
  if (score < 40) verdict = 'REJECTED';
  else if (score < 70) verdict = 'DANGEROUS';
  else if (score < 90) verdict = 'WARNING';

  const sanitized = score < 90 ? sanitizeResourceContent(text) : text;

  return {
    resourceName,
    resourceType,
    verdict,
    safetyScore: score,
    estimatedTokens: estTokens,
    findings,
    sanitizedContent: sanitized,
    canInstallSafely: verdict !== 'REJECTED',
    auditedAt: Date.now(),
    summaryText: getSummaryText(verdict, findings.length, score)
  };
};

const getSummaryText = (verdict: AuditVerdict, count: number, score: number): string => {
  if (verdict === 'SAFE') return `Tài nguyên sạch và an toàn (Điểm bảo vệ: ${score}/100).`;
  if (verdict === 'WARNING') return `Phát hiện ${count} điểm cần lưu ý (Điểm bảo vệ: ${score}/100).`;
  if (verdict === 'DANGEROUS') return `Cảnh báo: Tài nguyên tiềm ẩn rủi ro bảo mật (Điểm bảo vệ: ${score}/100).`;
  return `Từ chối: Phát hiện mã độc hại hoặc vi phạm an toàn nghiêm trọng (${score}/100).`;
};
