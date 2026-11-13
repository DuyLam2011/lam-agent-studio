export interface BuiltinCommandDefinition {
  id: string;
  command: string;
  aliases: string[];
  description: string;
  category: 'workflow' | 'system' | 'guardrail' | 'style';
  usage: string;
}

export const BUILTIN_AGENT_COMMANDS: BuiltinCommandDefinition[] = [
  {
    id: 'cmd-review',
    command: '/review',
    aliases: ['/audit', '/diff-review'],
    description: 'Kích hoạt Review Mode: Giao toàn bộ việc kiểm tra code (staged, unstaged, branch) cho Review Class (Read-Only)',
    category: 'workflow',
    usage: '/review [against <targetBranch>]'
  },
  {
    id: 'cmd-pentest',
    command: '/pentest',
    aliases: ['/security', '/security-audit'],
    description: 'Kích hoạt Penetration Testing Mode: Quét OWASP, lỗ hổng injection, rò rỉ secrets và quyền hạn (Read-Only)',
    category: 'workflow',
    usage: '/pentest [category: owasp | secrets | sandbox | full]'
  },
  {
    id: 'cmd-commit',
    command: '/commit',
    aliases: ['/git-commit'],
    description: 'Tự động phân tích git diff và soạn thảo Conventional Commit message chuẩn xác',
    category: 'workflow',
    usage: '/commit'
  },
  {
    id: 'cmd-grillme',
    command: '/grillme',
    aliases: ['/interview', '/clarify'],
    description: 'Kích hoạt Grill-Me Level Max: Khóa sửa code, nêu rõ thiếu sót, lập sơ bộ plan và phỏng vấn chọn A/B/C',
    category: 'guardrail',
    usage: '/grillme'
  },
  {
    id: 'cmd-safeguard',
    command: '/safeguard',
    aliases: ['/confirm-gate'],
    description: 'Kích hoạt cổng bảo vệ Safeguard: Yêu cầu xác nhận tường minh trước khi chạy lệnh shell rủi ro cao',
    category: 'guardrail',
    usage: '/safeguard'
  },
  {
    id: 'cmd-terminal',
    command: '/terminal',
    aliases: ['/bash'],
    description: 'Kích hoạt quyền thực thi lệnh shell/terminal tự động cho agent trong môi trường workspace',
    category: 'system',
    usage: '/terminal'
  },
  {
    id: 'cmd-help',
    command: '/help',
    aliases: ['/?', '/commands'],
    description: 'Hiển thị danh sách toàn bộ các built-in commands hỗ trợ trong Studio',
    category: 'system',
    usage: '/help'
  }
];

export const findBuiltinCommand = (text: string): { commandDef?: BuiltinCommandDefinition; args: string } => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return { args: trimmed };

  const parts = trimmed.split(/\s+/);
  const head = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ').trim();

  const found = BUILTIN_AGENT_COMMANDS.find(
    (c) => c.command.toLowerCase() === head || c.aliases.some((a) => a.toLowerCase() === head)
  );

  return { commandDef: found, args };
};
