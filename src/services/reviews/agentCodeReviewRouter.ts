import { SubagentPersona } from '../../types/subagents';

export interface CodeReviewIntent {
  isReview: boolean;
  targetRef?: string;
  baseRef?: string;
  reviewCategory: 'general' | 'security' | 'qa' | 'ui';
  recommendedSubagentId: string;
  recommendedSubagentName: string;
  rationale: string;
}

const REVIEW_PATTERNS = [
  /\b(code\s+review|review\s+code|review\s+changes|review\s+diff|review\s+pr|review\s+pull\s*request|review\s+branch|review\s+commit)\b/i,
  /\b(please\s+review|help\s+review|can\s+you\s+review|need\s+review|request\s+review)\b/i,
  /\b(soát\s+code|kiểm\s+tra\s+code|đánh\s+giá\s+code|soát\s+lỗi|kiểm\s+tra\s+diff|xem\s+lại\s+code|thẩm\s+định\s+code|rà\s+soát\s+mã)\b/i,
  /^\/(review|audit)\b/i,
  /\b(changes\s+on\s+\S+\s+against\s+\S+)\b/i,
  /\b(against\s+origin\/\S+|so\s+với\s+origin\/\S+)\b/i
];

export const detectCodeReviewIntent = (
  text: string,
  availableSubagents: SubagentPersona[] = [],
  taggedSubagentId?: string | null
): CodeReviewIntent => {
  const isMatch = REVIEW_PATTERNS.some((p) => p.test(text));
  if (!isMatch) {
    return {
      isReview: false,
      reviewCategory: 'general',
      recommendedSubagentId: 'subagent-backend-reviewer',
      recommendedSubagentName: 'Backend Review Specialist',
      rationale: 'Không phải yêu cầu code review.'
    };
  }

  // Detect branch comparison: e.g. "review changes on main against origin/main"
  const branchMatch = text.match(/(?:on\s+([a-zA-Z0-9_\-\./]+)\s+)?against\s+([a-zA-Z0-9_\-\./]+)/i) ||
    text.match(/so\s+với\s+([a-zA-Z0-9_\-\./]+)/i);
  const targetRef = branchMatch ? branchMatch[2] || branchMatch[1] : undefined;
  const baseRef = branchMatch && branchMatch[1] && branchMatch[2] ? branchMatch[1] : undefined;

  // Determine review category
  let category: CodeReviewIntent['reviewCategory'] = 'general';
  if (/security|owasp|bảo mật|secret|vulnerab|leak|token|auth/i.test(text)) {
    category = 'security';
  } else if (/qa|test|regression|hồi quy|integrity|toàn vẹn|spec/i.test(text)) {
    category = 'qa';
  } else if (/ui|ux|giao diện|styling|tailwind|css|layout/i.test(text)) {
    category = 'ui';
  }

  // Resolve subagent: Tagged > Category specific > Architecture Reviewer > Fallback
  let chosen: SubagentPersona | undefined;
  if (taggedSubagentId) {
    chosen = availableSubagents.find((s) => s.id === taggedSubagentId || s.id.includes(taggedSubagentId));
  }

  if (!chosen) {
    if (category === 'security') {
      chosen = availableSubagents.find((s) => s.id === 'subagent-security-harness' || s.id.includes('security'));
    } else if (category === 'qa') {
      chosen = availableSubagents.find((s) => s.id === 'subagent-qa-reviewer' || s.id.includes('qa'));
    } else if (category === 'ui') {
      chosen = availableSubagents.find((s) => s.id === 'subagent-ui-inspector' || s.id.includes('ui'));
    }
  }

  if (!chosen) {
    chosen = availableSubagents.find((s) => s.id === 'subagent-backend-reviewer' || s.agentClass === 'architecture') ||
      availableSubagents.find((s) => s.role.toLowerCase().includes('review')) ||
      availableSubagents[0];
  }

  const subId = chosen?.id || 'subagent-backend-reviewer';
  const subName = chosen?.name || 'Backend Review Specialist';
  const refInfo = targetRef ? ` đối chiếu nhánh [${targetRef}]` : ' trên toàn bộ working tree (staged, unstaged, untracked)';

  return {
    isReview: true,
    targetRef,
    baseRef,
    reviewCategory: category,
    recommendedSubagentId: subId,
    recommendedSubagentName: subName,
    rationale: `Phát hiện yêu cầu Code Review${refInfo}. Chỉ định ${subName} (Review Class) thực hiện kiểm định Read-Only.`
  };
};
