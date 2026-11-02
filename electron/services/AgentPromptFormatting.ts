import path from 'path';
import type { ToolCallResult } from '../agent/types';

export class AgentPromptFormatting {
  public static formatToolStepLabel(name: string, args: any): string {
    if (name === 'read_file') return `Read file: ${args?.path ? path.basename(args.path) : 'file'}`;
    if (name === 'write_file') return `Create/Write: ${args?.path ? path.basename(args.path) : 'file'}`;
    if (name === 'edit_file') return `Surgical patch: ${args?.path ? path.basename(args.path) : 'file'}`;
    if (name === 'run_command') return `Run command: ${args?.command || 'shell'}`;
    if (name === 'js' || name === 'node_repl') return `Node REPL: ${args?.code ? args.code.slice(0, 30).replace(/[\r\n]+/g, ' ') : 'script'}`;
    if (name === 'git_status') return `Inspect git working tree status`;
    if (name === 'git_diff') return `Audit git diff: ${args?.path ? path.basename(args.path) : (args?.staged ? 'staged diff' : 'recent changes')}`;
    if (name === 'list_directory') return `List directory: ${args?.path ? path.basename(args.path) : 'workspace root'}`;
    if (name === 'search_files') return `Search workspace: "${String(args?.query || '').slice(0, 40)}"`;
    if (name === 'browser_navigate') return `Navigate browser: ${args?.url || 'dev-server'}`;
    if (name === 'browser_inspect_element') return `Inspect DOM element: ${args?.selector || 'body'}`;
    if (name === 'browser_screenshot') return `Capture UI screenshot`;
    if (name === 'browser_console_logs') return `Read browser console logs`;
    if (name === 'browser_eval') return `Browser eval: ${String(args?.code || '').slice(0, 30)}`;
    if (name === 'read_skill') return `Read skill workflow: ${args?.skillName || 'skill'}`;
    if (name === 'verify_project_invariants') return `Run Multi-Tier Invariant & Test Verification (5-Step Gate)`;
    return `Execute tool: ${name}`;
  }

  public static getTurnStepLabel(turn: number, model: string, userText: string, lastTool?: ToolCallResult): string {
    if (turn === 0) {
      if (/security|owasp|leak|secret|vulnerab|audit|sanitize|injection/i.test(userText)) {
        return `Surveying context & scanning changes for security vulnerabilities...`;
      }
      if (/fix|edit|write|patch|refactor|implement|create/i.test(userText)) {
        return `Analyzing codebase & planning 5-step architectural implementation...`;
      }
      return `Decomposing goal & formulating execution plan with ${model}...`;
    }
    if (!lastTool) return `Refining analysis (step ${turn + 1})...`;
    switch (lastTool.name) {
      case 'git_diff':
      case 'git_status': return `Auditing git changes for logic, security & secrets leaks...`;
      case 'read_file': return /security|owasp|leak|secret|vulnerab|audit|sanitize|injection/i.test(userText)
        ? `Inspecting source lines for OWASP risks & validation...`
        : `Reviewing file contents and planning next step...`;
      case 'search_files':
      case 'list_directory': return `Mapping search results to relevant files...`;
      case 'browser_inspect_element':
      case 'browser_navigate': return `Inspecting rendered UI & DOM tree in browser preview...`;
      case 'browser_console_logs': return `Checking browser console errors and exceptions...`;
      case 'read_skill': return `Reading specialized skill guidelines & execution workflow...`;
      case 'edit_file':
      case 'write_file': return `Validating file modifications and integrity...`;
      case 'verify_project_invariants': return `Auditing deterministic multi-tier invariant gate outcomes...`;
      case 'run_command':
      case 'js': return `Evaluating execution telemetry and findings...`;
      default: return `Processing tool findings (step ${turn + 1})...`;
    }
  }

  public static generateFallbackReport(userText: string, tools: ToolCallResult[], diffs: any[]): string {
    const isSecurity = /security|owasp|leak|secret|vulnerab|audit|sanitize|injection/i.test(userText);
    const failed = tools.filter((t) => t.status === 'failed').length;
    if (isSecurity) {
      let report = `🛡️ **Security Audit Verdict:** **[INCONCLUSIVE]** — the model ran ${tools.length} inspection step(s) but returned no analysis, so no security conclusion can be drawn.\n\n`;
      report += `### 📑 Inspected Scope\n`;
      for (const t of tools) report += `- \`${t.name}\`: \`${t.args?.path || t.args?.command || JSON.stringify(t.args || {})}\` (${t.status})\n`;
      for (const d of diffs || []) report += `- \`${d.relativePath}\` (+${d.linesAdded}/-${d.linesRemoved})\n`;
      report += `\n### Next step\nAsk again (or switch to a stronger model) to get the actual findings for the scope above.`;
      return report;
    }
    let report = `### Execution Summary\n\nThe model ran ${tools.length} tool step(s)${failed ? ` (${failed} failed)` : ''} for *"${userText}"* but returned no written answer:\n\n`;
    for (const t of tools) {
      const raw = typeof t.result === 'string' ? t.result : JSON.stringify(t.result ?? '');
      report += `- ${t.status === 'failed' ? '❌' : '✅'} **${t.name}**: \`${raw.slice(0, 120).replace(/[\r\n]+/g, ' ')}\`\n`;
    }
    for (const d of diffs || []) report += `- 📝 Changed \`${d.relativePath}\` (+${d.linesAdded}/-${d.linesRemoved})\n`;
    return report;
  }
}
