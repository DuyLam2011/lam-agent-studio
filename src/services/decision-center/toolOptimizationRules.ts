import { ToolStrategyMeta, ToolStrategyType } from './decisionCenterTypes';

export const TOOL_STRATEGY_CONFIGS: Record<ToolStrategyType, ToolStrategyMeta> = {
  SURGICAL_PATCH: {
    type: 'SURGICAL_PATCH',
    title: 'Vá Mã Nguồn Cục Bộ (Surgical Patch)',
    description: 'Chỉ đọc phân đoạn cần sửa, áp dụng patch vi phẫu và xác minh tự động.',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    disallowedTools: ['run_command_sed', 'overwrite_full_file'],
    defaultPipeline: [
      { step: 1, tool: 'read_file_range', purpose: 'Đọc phân đoạn mã mục tiêu (tối đa 200 dòng)', isMandatory: true },
      { step: 2, tool: 'edit_file', purpose: 'Áp dụng patch cục bộ (giữ nguyên comment/docstrings)', isMandatory: true },
      { step: 3, tool: 'verify_project', purpose: 'Kiểm tra TypeScript & Test Suites tự động', isMandatory: false }
    ]
  },
  WORKSPACE_INSPECT: {
    type: 'WORKSPACE_INSPECT',
    title: 'Khảo Sát & Tra Cứu Mã Nguồn (Workspace Inspect)',
    description: 'Định vị tệp và đọc dữ kiện thực tế mà không gọi lệnh ghi đè hoặc shell thừa.',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    disallowedTools: ['edit_file', 'patch_file', 'run_command'],
    defaultPipeline: [
      { step: 1, tool: 'list_workspace_files', purpose: 'Quét và định vị đường dẫn tệp', isMandatory: true },
      { step: 2, tool: 'read_file_range', purpose: 'Đọc chính xác vị trí hàm hoặc dòng liên quan', isMandatory: true }
    ]
  },
  VERIFICATION_RUN: {
    type: 'VERIFICATION_RUN',
    title: 'Kiểm Thử & Đánh Giá Toàn Vẹn (Verification)',
    description: 'Kiểm tra trạng thái git và chạy xác thực các invariants.',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    disallowedTools: ['write_file', 'edit_file'],
    defaultPipeline: [
      { step: 1, tool: 'inspect_git_status', purpose: 'Kiểm tra danh sách tệp đã thay đổi trong working tree', isMandatory: true },
      { step: 2, tool: 'verify_project', purpose: 'Chạy typecheck và test suites', isMandatory: true }
    ]
  },
  ENVIRONMENT_ACTION: {
    type: 'ENVIRONMENT_ACTION',
    title: 'Tác Vụ Môi Trường & Shell Có Kiểm Soát (Environment)',
    description: 'Thực thi lệnh terminal qua Git Bash và giám sát exit code.',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    disallowedTools: [],
    defaultPipeline: [
      { step: 1, tool: 'run_command', purpose: 'Thực thi lệnh shell và thu thập stdout/stderr', isMandatory: true }
    ]
  },
  DIRECT_RESPONSE: {
    type: 'DIRECT_RESPONSE',
    title: 'Phản Hồi Trực Tiếp Không Dùng Tool (Direct Reasoning)',
    description: 'Tư vấn kiến trúc hoặc giải đáp kỹ thuật, tiết kiệm tối đa token.',
    badgeColor: 'text-slate-300 bg-slate-800 border-slate-700',
    disallowedTools: ['read_file', 'edit_file', 'run_command'],
    defaultPipeline: []
  }
};
