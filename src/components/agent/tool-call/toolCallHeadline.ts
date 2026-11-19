export interface ToolHeadline {
  action: string;
  target: string;
}

export const cleanShellCmd = (s: string): string => {
  if (!s) return '';
  const gitBash = s.match(/bash(?:\.exe)?["']?\s+(?:-l\s+)?-c\s+["']([^"']+)["']/i);
  if (gitBash && gitBash[1]) return gitBash[1].trim();
  const ps = s.match(/-Command\s+['"](?:bash\s+-lc\s+['"]([^'"]+)['"]|([^'"]+))['"]/i) ||
             s.match(/bash\s+-lc\s+['"]([^'"]+)['"]/i);
  return (ps ? (ps[1] || ps[2] || s) : s).replace(/^['"]|['"]$/g, '').trim();
};

export const resolveToolHeadline = (name: string, args: any = {}): ToolHeadline => {
  const filePath = args.filePath || args.path || args.Path || args.FilePath || args.filename || args.target_file || args.file || '';
  const targetFile = filePath ? filePath.split(/[/\\]/).pop() : '';

  if (name === 'read_file' || name === 'view_file') {
    const lines = args.startLine ? ` (L${args.startLine}-${args.endLine})` : (args.StartLine ? ` (L${args.StartLine}-${args.EndLine})` : '');
    return { action: 'Read File', target: `${targetFile || 'file'}${lines}` };
  }
  if (name === 'write_file' || name === 'write_to_file') return { action: 'Write File', target: targetFile || 'file' };
  if (['edit_file', 'patch_file', 'file_change', 'replace_file_content', 'multi_replace_file_content'].includes(name)) {
    return { action: args.isNew ? 'Write File' : 'Patch File', target: targetFile || 'file' };
  }
  if (['run_command', 'command_execution', 'bash', 'cmd', 'sh', 'terminal'].includes(name)) {
    const raw = args.CommandLine || args.commandLine || args.command || args.cmd || args.action || args.input || args.script || '';
    const unwrapped = cleanShellCmd(raw);
    return { action: 'Command', target: unwrapped || 'Terminal Command' };
  }
  if (name === 'delegate_to_subagent') {
    return { action: 'Delegate', target: args.subagentId || args.task || 'Subagent' };
  }
  if (name === 'js' || name === 'node_repl') return { action: 'Node REPL', target: 'In-Memory Script' };
  if (name === 'git_status') return { action: 'Git Status', target: 'Working Tree' };
  if (name === 'git_diff') return { action: 'Git Diff', target: targetFile || (args.staged ? 'Staged' : 'Working Tree') };
  if (name === 'list_directory' || name === 'list_workspace' || name === 'list_dir') return { action: 'List Dir', target: targetFile || 'root' };

  return { action: 'Tool', target: targetFile || name };
};
