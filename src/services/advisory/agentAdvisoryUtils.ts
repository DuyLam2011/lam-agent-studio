import { AgentCombo } from '../../types/agent-combo';

export interface SensitiveDetectionResult {
  isSensitive: boolean;
  category: 'database' | 'credentials' | 'system_command' | 'core_config' | 'none';
  riskLevel: 'low' | 'medium' | 'high';
  warningNote?: string;
}

export const detectSensitiveAction = (promptText: string): SensitiveDetectionResult => {
  const lower = (promptText || '').toLowerCase();

  if (/rm\s+-rf|del\s+\/s|drop\s+database|format\s+[a-z]:|mkfs/i.test(lower)) {
    return {
      isSensitive: true,
      category: 'system_command',
      riskLevel: 'high',
      warningNote: 'Cảnh báo lệnh Terminal có tính phá hủy cao (Hủy hoại tệp tin/ổ đĩa).'
    };
  }

  if (/password|secret|private[_\s]key|jwt|token|credential|\.env|id_rsa/i.test(lower)) {
    return {
      isSensitive: true,
      category: 'credentials',
      riskLevel: 'high',
      warningNote: 'Tác vụ truy cập hoặc can thiệp thông tin nhạy cảm/bảo mật (Credentials/Env/Key).'
    };
  }

  if (/schema|migration|drop\s+table|database|alter\s+table|seed/i.test(lower)) {
    return {
      isSensitive: true,
      category: 'database',
      riskLevel: 'medium',
      warningNote: 'Tác vụ can thiệp cấu trúc cơ sở dữ liệu (Database Schema/Migration).'
    };
  }

  if (/package\.json|tsconfig\.json|\.gitignore|vite\.config/i.test(lower)) {
    return {
      isSensitive: true,
      category: 'core_config',
      riskLevel: 'medium',
      warningNote: 'Tác vụ chỉnh sửa tệp cấu hình nền tảng của dự án.'
    };
  }

  return { isSensitive: false, category: 'none', riskLevel: 'low' };
};

export const checkComboRelevance = (
  promptText: string,
  activeCombo?: AgentCombo | null
): { isRelevant: boolean; bypassCombo: boolean; reason: string } => {
  if (!activeCombo) {
    return { isRelevant: true, bypassCombo: false, reason: 'Không có combo nào đang kích hoạt.' };
  }

  const lower = (promptText || '').toLowerCase().trim();
  const isReadOrExplainOnly = /^(giải thích|xem|đọc|tìm|kiểm tra|echo|cat|git status|lấy|hỏi)\b/i.test(lower) ||
    (lower.length < 40 && !/sửa|thay đổi|viết|tạo|refactor|build|test|deploy|fix/i.test(lower));

  if (isReadOrExplainOnly) {
    return {
      isRelevant: false,
      bypassCombo: true,
      reason: `Tác vụ đơn giản đọc hiểu/tra cứu, tự động bỏ qua Combo [${activeCombo.name}] để tiết kiệm token và giảm độ trễ.`
    };
  }

  return {
    isRelevant: true,
    bypassCombo: false,
    reason: `Yêu cầu phù hợp với quy trình điều phối đa tác vụ của [${activeCombo.name}].`
  };
};
