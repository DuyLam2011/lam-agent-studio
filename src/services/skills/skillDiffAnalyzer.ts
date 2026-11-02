import { SkillDiffAnalysis, SkillDiffAnomaly, SkillChangeSeverity } from '../../types/skill-eval';
import { parseSkillFrontmatter } from './skillValidationService';

export const analyzeSkillModificationDiff = (
  oldContent: string,
  newContent: string,
  skillName: string = 'skill'
): SkillDiffAnalysis => {
  const oldParsed = parseSkillFrontmatter(oldContent);
  const newParsed = parseSkillFrontmatter(newContent);

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const oldWords = oldContent.trim().split(/\s+/).filter(Boolean);
  const newWords = newContent.trim().split(/\s+/).filter(Boolean);

  const wordCountDelta = newWords.length - oldWords.length;
  const tokenCountDelta = Math.ceil(newContent.length / 3.8) - Math.ceil(oldContent.length / 3.8);

  const anomalies: SkillDiffAnomaly[] = [];

  // 1. Check YAML frontmatter integrity
  if (!newParsed.frontmatter?.name) {
    anomalies.push({
      type: 'syntax_error',
      severity: 'breaking',
      message: 'YAML frontmatter bị hỏng hoặc thiếu trường name: bắt buộc.'
    });
  }

  // 2. Check Trigger Drift
  const oldDesc = oldParsed.frontmatter?.description || '';
  const newDesc = newParsed.frontmatter?.description || '';
  const hadTrigger = /trigger|when|invoke|on "|command|\//i.test(oldDesc);
  const hasTrigger = /trigger|when|invoke|on "|command|\//i.test(newDesc);

  if (hadTrigger && !hasTrigger) {
    anomalies.push({
      type: 'trigger_drift',
      severity: 'breaking',
      message: 'Từ khóa kích hoạt (Trigger description) đã bị xóa, nguy cơ AutoSmartRouter không kích hoạt được skill.'
    });
  }

  // 3. Check Safety Guardrails Dropped
  const hadSafety = /safety|guardrail|permission|never|sanitize|owasp/i.test(oldParsed.body);
  const hasSafety = /safety|guardrail|permission|never|sanitize|owasp/i.test(newParsed.body);
  if (hadSafety && !hasSafety) {
    anomalies.push({
      type: 'safety_dropped',
      severity: 'breaking',
      message: 'Ràng buộc an toàn (Safety constraints/guardrails) bị gỡ bỏ trong bản sửa đổi.'
    });
  }

  // 4. Check Verification Step Dropped
  const hadVerify = /verify|test|assert|confirm|compile|tsc|exit code/i.test(oldParsed.body);
  const hasVerify = /verify|test|assert|confirm|compile|tsc|exit code/i.test(newParsed.body);
  if (hadVerify && !hasVerify) {
    anomalies.push({
      type: 'verification_dropped',
      severity: 'warning',
      message: 'Tiêu chí kiểm thử/xác thực (Verification Criteria) bị lược bỏ.'
    });
  }

  // 5. Check Token Bloat
  if (newWords.length > 500 && wordCountDelta > 50) {
    anomalies.push({
      type: 'token_bloat',
      severity: 'warning',
      message: `Độ dài vượt ngưỡng 500 từ (${newWords.length} từ, +${wordCountDelta} từ). Cần tách sang thư mục references/.`
    });
  }

  // Compute severity and verdict
  const hasBreaking = anomalies.some(a => a.severity === 'breaking');
  const hasWarning = anomalies.some(a => a.severity === 'warning');

  let severity: SkillChangeSeverity = 'neutral';
  let verdict: 'APPROVED' | 'REQUIRES_CHANGES' | 'BLOCKED' = 'APPROVED';

  if (hasBreaking) {
    severity = 'breaking';
    verdict = 'BLOCKED';
  } else if (hasWarning) {
    severity = 'warning';
    verdict = 'REQUIRES_CHANGES';
  } else if (wordCountDelta < 0 || (hasTrigger && !hadTrigger)) {
    severity = 'improvement';
    verdict = 'APPROVED';
  }

  const summary = verdict === 'APPROVED'
    ? `Bản sửa đổi an toàn (+${tokenCountDelta} tokens, ${anomalies.length} cảnh báo). Sẵn sàng áp dụng.`
    : verdict === 'REQUIRES_CHANGES'
      ? `Phát hiện ${anomalies.length} khuyến nghị cần hiệu chỉnh trước khi merge.`
      : `Phát hiện ${anomalies.length} lỗi nghiêm trọng phá vỡ hành vi của Agent. Đề nghị từ chối bản sửa đổi.`;

  return {
    oldName: oldParsed.frontmatter?.name || skillName,
    newName: newParsed.frontmatter?.name || skillName,
    linesAdded: Math.max(0, newLines.length - oldLines.length),
    linesRemoved: Math.max(0, oldLines.length - newLines.length),
    wordCountDelta,
    tokenCountDelta,
    anomalies,
    severity,
    isMergeSafe: verdict === 'APPROVED',
    verdict,
    summary
  };
};
