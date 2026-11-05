import { ToolCallItem } from '../../store/useAgentStore';
import { ActionWarningProps } from '../../components/agent/message/ActionWarningNote';
import { ClarificationOption } from './agentClarificationService';

export const findSensitiveToolCalls = (toolCalls?: ToolCallItem[]): ActionWarningProps[] => {
  if (!toolCalls || toolCalls.length === 0) return [];
  const results: ActionWarningProps[] = [];

  for (const tc of toolCalls) {
    if (!tc.autoApproved) continue;
    const targetStr = `${tc.name} ${JSON.stringify(tc.args || {})}`.toLowerCase();
    const isDangerousCmd = tc.name === 'run_command' && /rm\s+-rf|del\s+\/s|drop\s+database|format\s+[a-z]:/i.test(targetStr);
    const isSensitiveFile = (tc.name === 'write_file' || tc.name === 'edit_file' || tc.name === 'patch_file') &&
      /package\.json|tsconfig\.json|\.env|id_rsa|secret|key|database|schema/i.test(targetStr);

    if (isDangerousCmd || isSensitiveFile || tc.isSensitive) {
      const target = tc.args?.filePath || tc.args?.path || tc.args?.command || tc.name;
      results.push({
        title: isDangerousCmd ? 'Cảnh Báo Lệnh Terminal Tự Động Chạy' : 'Cảnh Báo Tệp Cấu Hình Đã Sửa',
        category: isDangerousCmd ? 'system_command' : 'core_config',
        target,
        description: `Tác vụ [${tc.name}] đã tự động được chấp thuận theo quyền hạn hệ thống.`,
        riskLevel: isDangerousCmd ? 'high' : 'medium',
        diffId: tc.diffId,
        autoApproved: true
      });
    }
  }

  return results;
};

export const detectClarificationInText = (
  text?: string
): { plan: string[]; options: ClarificationOption[]; riskAssessment?: string } | null => {
  if (!text) return null;
  const isVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);

  // Anti-loop gate: never display clarification card when agent is acknowledging or reporting execution
  const isAcknowledgmentOrReport = /(?:xác nhận ghi nhận|đã ghi nhận|ghi nhận lựa chọn|đã chọn|lựa chọn của bạn|triển khai theo phương án [a-d]|confirmed option|acknowledged choice|proceeding with option|executing option|kết quả kiểm toán|báo cáo kiểm toán|audit report|audit mode active)/i.test(text);
  if (isAcknowledgmentOrReport) {
    return null;
  }

  const hasQuestionnaireIndicator = /(?:###\s*.*(?:grill-me|bảng phỏng vấn|clarification|questions|câu hỏi|options|lựa chọn)|(?:vui lòng|hãy|bấm)\s*chọn\s*phương\s*án|please\s*select|which\s*option|choose\s*an\s*option|preliminary\s*plan|plan\s*sơ\s*bộ|\[GRILL-ME|\/?grill-me)/i.test(text);
  if (!hasQuestionnaireIndicator) {
    return null;
  }

  const options: ClarificationOption[] = [];
  const letters: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

  for (const id of letters) {
    const pattern = new RegExp(
      `(?:^|\\n)\\s*[-*•]?\\s*(?:\\[\\s*\\]\\s*)?(?:\\*\\*|__)?(?:(?:Option|Phương án|Lựa chọn)\\s*${id}|${id}[\\):.]|\\b${id}\\b\\s*[:\\-–])\\s*[:\\-–]?\\s*(?:\\*\\*|__)?([^\\n\\r*#]+?)(?:\\*\\*|__)?(?:\\r?\\n\\s*([^\\n\\r#\\-*]+))?(?:\\r?\\n|$)`,
      'i'
    );
    const match = text.match(pattern);
    if (match) {
      const rawTitle = match[1]?.trim() || `Option ${id}`;
      const cleanTitle = rawTitle.replace(/^[:\-–\s]+/, '').trim();
      const rawDesc = match[2]?.trim();
      const cleanDesc = rawDesc && !/^(?:option|phương án|[a-c][\):\.])/i.test(rawDesc) ? rawDesc : '';
      if (cleanTitle && cleanTitle.length > 2) {
        options.push({
          id,
          title: cleanTitle.length > 55 ? `${cleanTitle.slice(0, 52)}...` : cleanTitle,
          description: cleanDesc ? (cleanDesc.length > 95 ? `${cleanDesc.slice(0, 92)}...` : cleanDesc) : (isVi ? `Thực hiện theo lựa chọn ${id}` : `Execute according to Option ${id}`),
          impact: isVi ? `Phương án ${id}` : `Target Option ${id}`,
          promptPayload: isVi ? `Xác nhận triển khai theo Phương án ${id}: ${cleanTitle}` : `Proceed with Option ${id}: ${cleanTitle}`
        });
      }
    }
  }

  if (options.length === 0) {
    const hasExplicitGrillMeHeader = /(?:###\s*.*(?:grill-me|bảng phỏng vấn|clarification|questions|câu hỏi)|\[GRILL-ME|\/?grill-me)/i.test(text);
    if (!hasExplicitGrillMeHeader) return null;

    if (isVi) {
      options.push(
        { id: 'A', title: 'Phương án A: Tối thiểu & An toàn', description: 'Can thiệp cục bộ, bảo toàn 100% kiến trúc gốc.', impact: 'Rủi ro thấp nhất (Safe)', promptPayload: 'Xác nhận triển khai theo Phương án A (Tối thiểu & An toàn)' },
        { id: 'B', title: 'Phương án B: Chuẩn hóa Module', description: 'Phân rã module theo Rule 4, làm sạch types.', impact: 'Cân bằng hiệu năng & độ sạch', promptPayload: 'Xác nhận triển khai theo Phương án B (Chuẩn hóa Module)' },
        { id: 'C', title: 'Phương án C: Kiểm toán trước (Audit Only)', description: 'Chỉ lập báo cáo kiểm toán chi tiết, không sửa file ngay.', impact: 'Rà soát trước khi code', promptPayload: 'Xác nhận triển khai theo Phương án C (Chỉ Audit trước)' }
      );
    } else {
      options.push(
        { id: 'A', title: 'Option A: Minimal & Safe Patch', description: 'Surgical local fix preserving 100% existing architecture.', impact: 'Lowest risk (Safe)', promptPayload: 'Proceed with Option A (Minimal & Safe Patch)' },
        { id: 'B', title: 'Option B: Standard Modular Refactor', description: 'Decompose submodules adhering to Rule 4 (<150 lines).', impact: 'High maintainability & clean types', promptPayload: 'Proceed with Option B (Standard Modular Refactor)' },
        { id: 'C', title: 'Option C: Architecture Audit First', description: 'Perform grounded audit inspection before modifying code.', impact: 'Zero mutations (Audit Only)', promptPayload: 'Proceed with Option C (Architecture Audit First)' }
      );
    }
  }

  const plan: string[] = isVi ? [
    'Bước 1: Trinh sát & Khảo sát mã nguồn thực tế (Reconnaissance)',
    'Bước 2: Phẫu thuật code cục bộ theo phương án đã chọn (Surgical Patch)',
    'Bước 3: Tự động chạy npx tsc & test kiểm chứng 100% invariants'
  ] : [
    'Step 1: Code Reconnaissance & Targeted File Inspection',
    'Step 2: Surgical Local Patch adhering to Rule 4 (<150 lines)',
    'Step 3: Verification Gate verifying 100% system invariants'
  ];

  const riskAssessment = isVi
    ? 'Hệ thống đã nhận diện phương án đa ngã. Hãy bấm chọn phương án mong muốn ở trên để tiếp tục.'
    : 'Multiple execution paths identified. Select your preferred option above to proceed.';

  return { plan, options, riskAssessment };
};
