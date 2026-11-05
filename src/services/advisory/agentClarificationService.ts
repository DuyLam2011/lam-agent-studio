import { TaskComplexityReport } from '../benchmark/taskComplexityCalculator';
import { HistoryPayloadEntry } from '../agent-chat/chatHistoryBuilder';

export interface ClarificationOption {
  id: 'A' | 'B' | 'C';
  title: string;
  description: string;
  impact: string;
  promptPayload: string;
}

export interface ClarificationReport {
  needsClarification: boolean;
  reason?: string;
  preliminaryPlan: string[];
  riskAssessment: string;
  options: ClarificationOption[];
  directiveMarkdown: string;
}

export const analyzeClarificationNeeds = (
  promptText: string,
  complexity?: TaskComplexityReport | null,
  history?: HistoryPayloadEntry[]
): ClarificationReport => {
  const lower = (promptText || '').trim().toLowerCase();
  const isVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(promptText);
  const isShort = lower.length < 35 && !lower.includes(';') && !lower.includes('\n');
  const hasAmbiguousKeywords = /rewrite|optimize|refactor|overhaul|migrate|redesign|setup|viết lại|tối ưu|làm mới|chuyển đổi|nâng cấp/i.test(lower);
  const isHighComplexity = complexity ? complexity.score >= 55 : false;

  // Anti-loop gates: user confirmed option, gave concrete file targets, or answered previous questionnaire
  const isOptionSelection = /(?:xác nhận triển khai theo phương án|proceed with option|phương án\s+[a-c]|option\s+[a-c]|chỉ audit|audit first|tối thiểu & an toàn|minimal & safe|chuẩn hóa module|standard (?:modular|refactor)|làm đi|apply changes|áp dụng)/i.test(lower);
  const hasConcreteTargets = /(?:src\/|electron\/|\.tsx?|\.jsx?|\.json|\.css|\.md|package\.json)/i.test(lower);
  const lastAssistantTurn = history && history.length > 0
    ? [...history].reverse().find((h) => h.role === 'agent')
    : undefined;
  const lastAgentAskedQuestions = lastAssistantTurn
    ? /(?:grill-me|phương án\s+[a-c]|option\s+[a-c]|bảng phỏng vấn|preliminary plan|vui lòng chọn phương án|choose an option)/i.test(lastAssistantTurn.text || '')
    : false;

  const suppressedByAntiLoop = isOptionSelection || lastAgentAskedQuestions || hasConcreteTargets;
  const needsClarification = !suppressedByAntiLoop && ((isShort && hasAmbiguousKeywords) || (hasAmbiguousKeywords && isHighComplexity));

  if (!needsClarification) {
    return {
      needsClarification: false,
      preliminaryPlan: [],
      riskAssessment: isVi ? 'Tác vụ có phạm vi xác định rõ ràng, sẵn sàng thực thi.' : 'Task scope is clear and grounded, ready for direct execution.',
      options: [],
      directiveMarkdown: ''
    };
  }

  const preliminaryPlan = isVi ? [
    'Bước 1: Trinh sát mã nguồn (Reconnaissance) — Rà soát các module liên quan bằng ast-grep & git status.',
    'Bước 2: Phẫu thuật code cục bộ (Surgical Patch) — Áp dụng thay đổi tối thiểu, tuân thủ Rule 4 (<150 dòng).',
    'Bước 3: Kiểm chứng toàn diện (Invariant Verification) — Chạy npx tsc và npm test bảo toàn 100% test suites.'
  ] : [
    'Step 1: Code Reconnaissance — Survey target files and repository context via search & read tools.',
    'Step 2: Surgical Local Patch — Apply minimal changes strictly adhering to Rule 4 (<150 lines per file).',
    'Step 3: Invariant Verification Gate — Execute typecheck and regression tests to guarantee integrity.'
  ];

  const riskAssessment = isHighComplexity
    ? (isVi ? 'Tác vụ có độ phức tạp cao, có thể ảnh hưởng đến luồng dữ liệu liên module.' : 'High task complexity; multi-module data flow or core configs may be affected.')
    : (isVi ? 'Yêu cầu còn khái quát, cần chọn phạm vi can thiệp tối ưu để tránh sửa nhầm mã nguồn.' : 'Objective is broad; selecting an explicit scope is recommended to avoid unwanted regressions.');

  const options: ClarificationOption[] = isVi ? [
    {
      id: 'A',
      title: 'Phương án Tối Thiểu (Minimal & Safe)',
      description: 'Chỉ sửa đổi cục bộ tại đúng điểm lỗi, bảo toàn nguyên vẹn kiến trúc hiện hữu.',
      impact: 'Rủi ro thấp nhất (0% breaking change), hoàn tất tức thì.',
      promptPayload: `Triển khai theo Phương án A (Tối thiểu & An toàn): ${promptText}`
    },
    {
      id: 'B',
      title: 'Phương án Chuẩn Hóa Module (Standard Refactor)',
      description: 'Tách module nhỏ tuân thủ Rule 4, làm sạch code và bổ sung types an toàn.',
      impact: 'Cân bằng giữa hiệu năng, độ sạch của code và độ ổn định.',
      promptPayload: `Triển khai theo Phương án B (Chuẩn hóa Module & Rule 4): ${promptText}`
    },
    {
      id: 'C',
      title: 'Phương án Đánh Giá Kiến Trúc Trước (Audit First)',
      description: 'Chỉ chạy kiểm toán và liệt kê danh sách file cần sửa, KHÔNG thay đổi code ngay.',
      impact: 'Cung cấp báo cáo audit chi tiết để bạn duyệt trước khi code.',
      promptPayload: `Triển khai theo Phương án C (Chỉ Audit & Báo Cáo): ${promptText}`
    }
  ] : [
    {
      id: 'A',
      title: 'Option A: Minimal & Safe Patch',
      description: 'Apply surgical local fix preserving 100% of the existing architecture.',
      impact: 'Lowest risk (0% breaking change), immediate resolution.',
      promptPayload: `Proceed with Option A (Minimal & Safe Patch): ${promptText}`
    },
    {
      id: 'B',
      title: 'Option B: Standard Modular Refactor',
      description: 'Decompose into clean submodules adhering to Rule 4 (<150 lines) with strict types.',
      impact: 'Optimal maintainability, modularity, and cleanliness.',
      promptPayload: `Proceed with Option B (Standard Modular Refactor): ${promptText}`
    },
    {
      id: 'C',
      title: 'Option C: Architecture Audit First',
      description: 'Perform static inspection and list affected files without mutating code yet.',
      impact: 'Read-only architectural report for review before coding.',
      promptPayload: `Proceed with Option C (Architecture Audit First): ${promptText}`
    }
  ];

  const directiveMarkdown = [
    `[GRILL-ME PROTOCOL ACTIVATED - CONTEXT OPTIMIZATION & TARGETED QUESTIONS]`,
    `Language Standard: ALWAYS prioritize English. If the user asks in English, reply 100% in English. Default to English.`,
    `Anti-Loop Invariant: Never ask questions repeatedly. When user selects an option or provides answers, PROCEED TO EXECUTION/AUDIT IMMEDIATELY.`,
    `Zero Skill Noise: DO NOT name, list, or mention internal skill names (no "Skills Đã Dùng" or skill IDs) in Grill-Me responses!`,
    `Targeted Questions: If context is insufficient, evaluate what to ask the user. Present:`,
    `1. 📋 Preliminary Execution Plan (3 steps: Reconnaissance -> Surgical Patch -> Verification)`,
    `2. ⚠️ Missing Context & Risk Assessment (${riskAssessment})`,
    `3. ❓ Targeted Options (Option A: Minimal Safe, Option B: Standard Modular, Option C: Audit First)`,
    `Wait for user option selection or confirmation before executing mutations.`
  ].join('\n');

  return {
    needsClarification: true,
    reason: isVi ? 'Yêu cầu có tính khái quát, cần làm rõ phạm vi trước khi code.' : 'Objective requires scope clarification before mutations.',
    preliminaryPlan,
    riskAssessment,
    options,
    directiveMarkdown
  };
};
