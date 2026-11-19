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
    description: 'Activate Review Mode: Delegate code inspection (staged, unstaged, branch) to Review Class subagent (Read-Only)',
    category: 'workflow',
    usage: '/review [against <targetBranch>]'
  },
  {
    id: 'cmd-pentest',
    command: '/pentest',
    aliases: ['/security', '/security-audit'],
    description: 'Activate Penetration Testing Mode: Scan OWASP vulnerabilities, injection, secret leaks & permissions (Read-Only)',
    category: 'workflow',
    usage: '/pentest [category: owasp | secrets | sandbox | full]'
  },
  {
    id: 'cmd-commit',
    command: '/commit',
    aliases: ['/git-commit'],
    description: 'Analyze git diff and draft a concise, conventional git commit message',
    category: 'workflow',
    usage: '/commit'
  },
  {
    id: 'cmd-decision',
    command: '/decision',
    aliases: ['/clarify', '/interview', '/decision-level', '/grillme'],
    description: 'Agent Decision Level: Socratic clarification interview, missing context analysis & option selection',
    category: 'guardrail',
    usage: '/decision'
  },
  {
    id: 'cmd-safeguard',
    command: '/safeguard',
    aliases: ['/confirm-gate'],
    description: 'Activate Safeguard Gate: Inspect high-risk commands and require explicit user confirmation before execution',
    category: 'guardrail',
    usage: '/safeguard'
  },
  {
    id: 'cmd-terminal',
    command: '/terminal',
    aliases: ['/bash'],
    description: 'Enable automated Bash/terminal execution permissions in the workspace Git Bash sandbox',
    category: 'system',
    usage: '/terminal'
  },
  {
    id: 'cmd-help',
    command: '/help',
    aliases: ['/?', '/commands'],
    description: 'Display quick reference table of all built-in studio commands',
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
