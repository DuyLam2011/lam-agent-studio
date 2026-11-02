import { ToolCallItem } from '../store/useAgentStore';
import { ActionWarningProps } from '../components/agent/message/ActionWarningNote';
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
  const hasGrillMe = /phương án a|option a|bảng phỏng vấn|grill-me|preliminary plan|bước 1:/i.test(text);
  if (!hasGrillMe) return null;

  const options: ClarificationOption[] = [];
  if (/phương án a|option a/i.test(text)) {
    options.push({
      id: 'A',
      title: 'Phương án A: Tối thiểu & An toàn',
      description: 'Can thiệp cục bộ, bảo toàn 100% kiến trúc gốc.',
      impact: 'Rủi ro thấp nhất (Safe)',
      promptPayload: 'Xác nhận triển khai theo Phương án A (Tối thiểu & An toàn)'
    });
  }
  if (/phương án b|option b/i.test(text)) {
    options.push({
      id: 'B',
      title: 'Phương án B: Chuẩn hóa Module',
      description: 'Phân rã module theo Rule 4, làm sạch types.',
      impact: 'Cân bằng hiệu năng & độ sạch',
      promptPayload: 'Xác nhận triển khai theo Phương án B (Chuẩn hóa Module)'
    });
  }
  if (/phương án c|option c/i.test(text)) {
    options.push({
      id: 'C',
      title: 'Phương án C: Kiểm toán trước (Audit Only)',
      description: 'Chỉ lập báo cáo kiểm toán chi tiết, không sửa file ngay.',
      impact: 'Rà soát trước khi code',
      promptPayload: 'Xác nhận triển khai theo Phương án C (Chỉ Audit trước)'
    });
  }

  const plan: string[] = [
    'Bước 1: Trinh sát & Khảo sát mã nguồn thực tế (Reconnaissance)',
    'Bước 2: Phẫu thuật code cục bộ theo phương án đã chọn (Surgical Patch)',
    'Bước 3: Tự động chạy npx tsc & test kiểm chứng 100% invariants'
  ];

  return { plan, options, riskAssessment: 'Hệ thống đã nhận diện phương án đa ngã. Bạn có thể chọn phương án mong muốn ở trên.' };
};
