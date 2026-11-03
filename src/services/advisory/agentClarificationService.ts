import { TaskComplexityReport } from '../benchmark/taskComplexityCalculator';

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
  complexity?: TaskComplexityReport | null
): ClarificationReport => {
  const lower = (promptText || '').trim().toLowerCase();
  const isShort = lower.length < 35 && !lower.includes(';') && !lower.includes('\n');
  const hasAmbiguousKeywords = /viết lại|tối ưu|refactor|làm mới|chuyển đổi|nâng cấp|thay đổi toàn bộ|đổi kiến trúc|setup|overhaul/i.test(lower);
  const isHighComplexity = complexity ? complexity.score >= 55 : false;

  const needsClarification = (isShort && hasAmbiguousKeywords) || (hasAmbiguousKeywords && isHighComplexity);

  if (!needsClarification) {
    return {
      needsClarification: false,
      preliminaryPlan: [],
      riskAssessment: 'Tác vụ có phạm vi xác định rõ ràng, sẵn sàng thực thi trực tiếp.',
      options: [],
      directiveMarkdown: ''
    };
  }

  const preliminaryPlan = [
    'Bước 1: Trinh sát mã nguồn (Reconnaissance) — Rà soát các module liên quan bằng ast-grep & git status.',
    'Bước 2: Phẫu thuật code cục bộ (Surgical Patch) — Áp dụng thay đổi tối thiểu, tuân thủ Rule 4 (<150 dòng).',
    'Bước 3: Kiểm chứng toàn diện (Invariant Verification) — Chạy npx tsc và npm test bảo toàn 100% test suites.'
  ];

  const riskAssessment = isHighComplexity
    ? 'Tác vụ có độ phức tạp cao, có thể ảnh hưởng đến luồng dữ liệu liên module hoặc cấu hình cốt lõi.'
    : 'Yêu cầu còn tương đối khái quát, cần chọn phạm vi can thiệp tối ưu để tránh sửa nhầm mã nguồn ngoài ý muốn.';

  const options: ClarificationOption[] = [
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
  ];

  const directiveMarkdown = [
    `[GRILL-ME PROTOCOL ACTIVATED - AMBIGUOUS/HIGH-COMPLEXITY PROMPT]`,
    `The user objective is broad or high-risk. Before executing destructive mutations, you MUST present:`,
    `1. 📋 Preliminary Execution Plan (3 steps: Reconnaissance -> Surgical Patch -> Verification)`,
    `2. ⚠️ Risk Assessment (${riskAssessment})`,
    `3. ❓ Targeted Options (Option A: Minimal Safe, Option B: Standard Modular, Option C: Audit First)`,
    `Always ask the user for confirmation on the preferred path if they have not pre-approved turbo mode.`
  ].join('\n');

  return {
    needsClarification: true,
    reason: 'Yêu cầu có tính khái quát hoặc độ phức tạp cao, cần làm rõ phạm vi trước khi biến đổi code.',
    preliminaryPlan,
    riskAssessment,
    options,
    directiveMarkdown
  };
};
