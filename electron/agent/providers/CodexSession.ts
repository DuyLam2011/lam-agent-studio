import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import { codexAccountService } from '../../services/CodexAccountService';
import type { NormalizedTurn } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolCall, ModelToolResult, ModelTurnResult } from '../types';

export interface CodexSessionConfig {
  model: string;
  systemInstruction?: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens?: number;
  reasoningEffort?: string;
}

const VALID_CODEX_MODELS = [
  'gpt-6.2-sol', 'gpt-6.2-astra', 'gpt-6.1-terra', 'gpt-6.1-sol', 'gpt-6-astra', 'gpt-6-sol', 'gpt-6-luna',
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1', 'o1-mini'
];
const cleanCmd = (s: string) => {
  const ps = s.match(/-Command\s+['"](?:bash\s+-lc\s+['"]([^'"]+)['"]|([^'"]+))['"]/i) || s.match(/bash\s+-lc\s+['"]([^'"]+)['"]/i);
  return (ps ? (ps[1] || ps[2] || s) : s).replace(/^['"]|['"]$/g, '').trim();
};

export class CodexSession implements ModelSession {
  public readonly provider = 'codex' as const;
  public readonly model: string;
  private turns: NormalizedTurn[];
  private systemInstruction: string;
  private reasoningEffort: string;

  constructor(cfg: CodexSessionConfig) {
    this.model = cfg.model || 'gpt-6.2-sol';
    this.turns = [...cfg.turns];
    this.systemInstruction = cfg.systemInstruction || '';
    this.reasoningEffort = cfg.reasoningEffort || '';
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, _opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const binPath = codexAccountService.getBinaryPath();
    const promptPayload = this.buildPromptPayload();
    const targetModel = VALID_CODEX_MODELS.includes(this.model) || /^(gpt-|o)/i.test(this.model) ? this.model : 'gpt-6.2-sol';

    return new Promise<ModelTurnResult>((resolve, reject) => {
      const args = ['exec', '-m', targetModel];
      if (['low', 'medium', 'high'].includes(this.reasoningEffort)) args.push('-c', `model_reasoning_effort="${this.reasoningEffort}"`);
      args.push('--json', '--ephemeral', '--skip-git-repo-check', '-');

      let child: ChildProcess;
      try {
        child = spawn(binPath, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
        child.stdin!.write(promptPayload);
        child.stdin!.end();
      } catch (err) {
        return reject(new Error(`Failed to spawn Codex binary at ${binPath}: ${err}`));
      }

      let text = '', thinking = '', stderrText = '';
      const toolCalls: ModelToolCall[] = [];
      const toolMap = new Map<string, ModelToolCall>();
      const resolvedTools = new Set<string>();
      const onAbort = () => { try { child.kill('SIGTERM'); } catch {} reject(new Error('Codex run aborted by user')); };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });

      const rl = readline.createInterface({ input: child.stdout!, crlfDelay: Infinity });
      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) return;
        try {
          const parsed = JSON.parse(trimmed);
          const item = parsed.item || parsed;
          const iType = item.type || parsed.type || '';
          if (iType === 'reasoning' || parsed.type?.includes('reasoning')) {
            const tChunk = item.text || parsed.delta || parsed.text || '';
            if (tChunk) { thinking += tChunk; handlers.onThinking(tChunk); }
          } else if (iType === 'agent_message' || parsed.type?.includes('text') || parsed.type === 'response.text.delta') {
            const aChunk = item.text || parsed.delta || parsed.text || '';
            if (aChunk) { text += aChunk; handlers.onText(aChunk); }
          } else if (/command|tool|file_change/.test(iType) || parsed.type?.includes('command')) {
            const id = item.id || parsed.id || `codex-tool-${toolCalls.length + 1}`;
            const isCmd = iType.includes('command') || parsed.type?.includes('command');
            const name = isCmd ? 'run_command' : iType.includes('file_change') ? 'edit_file' : (item.name || iType || 'tool');
            const cmdStr = cleanCmd(item.command || item.cmd || item.input || parsed.command || item.args?.command || '');
            const filePath = item.path || item.filePath || item.file_path || item.filename || '';
            const rawOut = item.aggregated_output || item.output || item.result || item.stdout || item.diff || item.patch || '';
            const isFailed = item.exit_code != null && item.exit_code !== 0;
            const outStr = rawOut || (item.exit_code != null ? (item.exit_code === 0 ? 'Exit code 0 (Success)' : `Exit code ${item.exit_code} (Failed)`) : '');

            const extractedArgs: Record<string, any> = cmdStr ? { command: cmdStr } : filePath ? { path: filePath, diff: item.diff || item.patch } : {};
            if (typeof item.arguments === 'string') { try { Object.assign(extractedArgs, JSON.parse(item.arguments)); } catch {} }
            else if (item.arguments || item.args) Object.assign(extractedArgs, item.arguments || item.args);

            const existing = toolMap.get(id);
            if (!existing) {
              const tc: ModelToolCall = { id, name, args: extractedArgs };
              toolMap.set(id, tc); toolCalls.push(tc); handlers.onToolCall?.(tc);
            } else if (Object.keys(extractedArgs).length > 0) existing.args = { ...existing.args, ...extractedArgs };

            if (outStr || parsed.type === 'item.completed' || item.status === 'completed') {
              resolvedTools.add(id);
              handlers.onToolResult?.({ callId: id, name: existing?.name || name, output: outStr || (isFailed ? 'Command execution failed' : 'Exit code 0 (Success)'), failed: isFailed });
            }
          }
        } catch {}
      });

      child.stderr?.on('data', (chunk) => { stderrText += chunk.toString(); });
      child.on('error', (err) => { signal.removeEventListener('abort', onAbort); reject(new Error(`Codex process error: ${err.message}`)); });
      child.on('close', (code) => {
        signal.removeEventListener('abort', onAbort);
        if (code !== 0 && !text) return reject(new Error(`Codex exited with code ${code}: ${stderrText.slice(0, 500) || 'Unknown error'}`));
        for (const [id, tc] of toolMap) {
          if (!resolvedTools.has(id)) handlers.onToolResult?.({ callId: id, name: tc.name, output: 'Exit code 0 (Success)', failed: false });
        }
        this.turns.push({ role: 'model', text });
        resolve({ text, thinking, toolCalls, finishReason: 'STOP' });
      });
    });
  }

  public appendToolResults(results: ModelToolResult[]) {
    this.turns.push({ role: 'user', text: `[Tool Execution Results]\n${results.map((r) => `[Tool: ${r.name}] -> ${r.failed ? 'ERROR: ' : ''}${r.output}`).join('\n')}` });
  }

  public appendUserText(text: string) {
    const last = this.turns[this.turns.length - 1];
    if (last?.role === 'user') last.text += `\n${text}`;
    else this.turns.push({ role: 'user', text });
  }

  private buildPromptPayload(): string {
    const parts: string[] = [];
    if (this.systemInstruction) parts.push(`[System Instructions]\n${this.systemInstruction}\n`);
    for (const t of this.turns) parts.push(`[${t.role.toUpperCase()}]\n${t.text}\n`);
    return parts.join('\n');
  }
}
