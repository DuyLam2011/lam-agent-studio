import { AgentSkill } from '../../types/skills';
import { AgentCombo } from '../../types/agent-combo';
import { standardBuiltinAgentCombos } from '../../data/defaultAgentCombos';
import { scoreWorkspaceForCombos } from '../combos/workspaceComboAuditorService';
import { detectSensitiveAction, checkComboRelevance, SensitiveDetectionResult } from './agentAdvisoryUtils';

export interface AdvisoryReport {
  appliedSkillName: string;
  appliedSkillReason: string;
  recommendedSkills: Array<{ name: string; reason: string }>;
  prunedSkills: Array<{ name: string; reason: string }>;
  activeTools: string[];
  recommendedComboName: string;
  recommendedComboReason: string;
  comboRelevance: { isRelevant: boolean; bypassCombo: boolean; reason: string };
  sensitiveWarning?: SensitiveDetectionResult;
  advisoryMarkdown: string;
}

export const generateAdvisoryReport = (
  promptText: string,
  availableSkills: AgentSkill[] = [],
  activeCombo?: AgentCombo | null,
  dirEntries: string[] = []
): AdvisoryReport => {
  const lower = (promptText || '').toLowerCase();
  const recommendedSkills: Array<{ name: string; reason: string }> = [];
  const prunedSkills: Array<{ name: string; reason: string }> = [];

  // Skill matching
  if (/security|vulnerab|secret|owasp|leak|auth|token|jwt/i.test(lower)) {
    recommendedSkills.push({ name: 'security_audit', reason: 'Rà soát lỗ hổng OWASP và kiểm tra bảo mật dữ liệu đầu vào.' });
  }
  if (/review|audit|diff|pr|pull request|code review|refactor/i.test(lower)) {
    recommendedSkills.push({ name: 'code_review', reason: 'Đánh giá kiến trúc mã nguồn và kiểm tra Rule 4 (<150 dòng).' });
  }
  if (/bug|error|fix|issue|crash|fail|exception|debug/i.test(lower)) {
    recommendedSkills.push({ name: 'debug_issue', reason: 'Tuân thủ quy trình Iron Law Debugging: khảo sát trước khi sửa.' });
  }
  if (/ui|css|tailwind|style|design|responsive|button|layout/i.test(lower)) {
    recommendedSkills.push({ name: 'ui_ux_review', reason: 'Tối ưu hóa UI Design System và tương phản WCAG 2.1.' });
  }
  if (/optimize|cleanup|modular|split|monolith/i.test(lower)) {
    recommendedSkills.push({ name: 'optimize_codebase', reason: 'Tái cấu trúc tệp tin cồng kềnh thành các module nhỏ.' });
  }

  // Check available skills for relevance vs pruning
  for (const s of availableSkills) {
    const isKeywordMatched = lower.includes(s.name.toLowerCase()) || (s.folderName && lower.includes(s.folderName.toLowerCase()));
    if (!recommendedSkills.some(r => r.name === s.name)) {
      if (isKeywordMatched) {
        recommendedSkills.push({ name: s.name, reason: s.description || 'Kỹ năng chuyên biệt phù hợp với từ khóa.' });
      } else if (s.scope !== 'global') {
        prunedSkills.push({ name: s.name, reason: 'Không liên quan trực tiếp đến nội dung prompt (tạm thời bỏ qua để tiết kiệm token).' });
      }
    }
  }

  // Active tools
  const activeTools = ['edit_file', 'write_file', 'read_file', 'search_files', 'git_diff'];
  if (/terminal|command|bash|shell|npm|install|run/i.test(lower)) activeTools.push('run_command');
  if (/test|verify|build|check/i.test(lower)) activeTools.push('verify_project_invariants');
  if (/browser|dom|inspect|preview/i.test(lower)) activeTools.push('browser_inspect');

  // Combo assessment & relevance check
  const comboAudit = scoreWorkspaceForCombos(null, dirEntries, standardBuiltinAgentCombos);
  const comboName = activeCombo?.name || comboAudit.recommendedComboName;
  const comboReason = activeCombo?.description || comboAudit.detectedSignals[0] || 'Phù hợp kiến trúc workspace';
  const comboRelevance = checkComboRelevance(promptText, activeCombo);

  // Sensitive & high-risk action detection
  const sensitiveWarning = detectSensitiveAction(promptText);

  const primarySkill = recommendedSkills[0] || {
    name: 'general_development',
    reason: 'Phát triển tính năng tiêu chuẩn với quy trình 5 bước verification.'
  };

  const advisoryLines = [
    `### 💡 Tư Vấn Kiến Trúc, Kỹ Năng & Tối Ưu Hóa (Architectural & Skills Advisory):`,
    `- ⚡ **Kỹ Năng Đang Áp Dụng (Skills):** \`${primarySkill.name}\` — *${primarySkill.reason}*`,
    `- 🔌 **Công Cụ Tối Ưu (Tools):** ${activeTools.map(t => `\`${t}\``).join(', ')}`,
    `- 🔄 **Điều Phối Combo:** \`${comboName}\` — *${comboRelevance.reason}*`
  ];

  if (prunedSkills.length > 0) {
    advisoryLines.push(`- ✂️ **Kỹ Năng Đã Lược Bỏ (Token Saving):** ${prunedSkills.slice(0, 3).map(s => `\`${s.name}\``).join(', ')} (Tránh dư thừa ngữ cảnh)`);
  }

  if (sensitiveWarning.isSensitive) {
    advisoryLines.push(`- ⚠️ **CẢNH BÁO TÁC VỤ NHẠY CẢM (${sensitiveWarning.riskLevel.toUpperCase()} RISK):** ${sensitiveWarning.warningNote}`);
  }

  return {
    appliedSkillName: primarySkill.name,
    appliedSkillReason: primarySkill.reason,
    recommendedSkills,
    prunedSkills,
    activeTools,
    recommendedComboName: comboName,
    recommendedComboReason: comboReason,
    comboRelevance,
    sensitiveWarning: sensitiveWarning.isSensitive ? sensitiveWarning : undefined,
    advisoryMarkdown: advisoryLines.join('\n')
  };
};
