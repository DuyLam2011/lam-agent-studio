import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import type { NormalizedTurn } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolCall, ModelToolResult, ModelTurnResult } from '../types';

export interface ClaudeCodeSessionConfig {
  model: string;
  systemInstruction?: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens?: number;
}

export class ClaudeCodeSession implements ModelSession {
  public readonly provider = 'claudecode' as const;
  public readonly model: string;
  private turns: NormalizedTurn[];
  private systemInstruction: string;

  constructor(cfg: ClaudeCodeSessionConfig) {
    const isClaude = (cfg.model || '').toLowerCase().startsWith('claude');
    this.model = isClaude ? cfg.model : 'claude-3-7-sonnet';
    this.turns = [...cfg.turns];
    this.systemInstruction = cfg.systemInstruction || '';
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, _opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const promptPayload = this.buildPromptPayload();

    return new Promise<ModelTurnResult>((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? 'npx.cmd' : 'npx';
      const args = ['@anthropic-ai/claude-code', '-p', promptPayload, '--dangerously-skip-permissions', '--model', this.model];

      let child: ChildProcess;
      try {
        child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: isWin });
        child.stdin?.end();
      } catch (err) {
        return reject(new Error(`Failed to spawn Claude Code official runtime: ${err}`));
      }

      let text = '';
      let thinking = '';
      let stderrText = '';
      const toolCalls: ModelToolCall[] = [];
      const seenTools = new Set<string>();

      const onAbort = () => {
        try { child.kill('SIGTERM'); } catch {}
        reject(new Error('Claude Code run aborted by user'));
      };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });

      const rl = readline.createInterface({ input: child.stdout!, crlfDelay: Infinity });

      rl.on('line', (line) => {
        const clean = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        if (clean.includes('Safe-chain:') || clean.includes('Claude Code ignored the certificate') || clean.includes('Warning: no stdin data')) return;

        if (clean.startsWith('Running ') || clean.startsWith('Read ') || clean.startsWith('Edit ') || clean.startsWith('Bash:')) {
          const id = `claude-tool-${Date.now()}`;
          if (!seenTools.has(clean)) {
            seenTools.add(clean);
            const isCmd = clean.startsWith('Running ') || clean.startsWith('Bash:');
            const isEdit = clean.startsWith('Edit ');
            const isRead = clean.startsWith('Read ');
            const name = isCmd ? 'run_command' : isEdit ? 'edit_file' : isRead ? 'read_file' : 'tool';
            const cmd = isCmd ? clean.replace(/^(Running|Bash:)\s*/, '') : undefined;
            const file = !isCmd ? clean.replace(/^(Edit|Read)\s*/, '') : undefined;
            const args = cmd ? { command: cmd } : file ? { path: file } : { action: clean };
            const tc: ModelToolCall = { id, name, args };
            toolCalls.push(tc);
            handlers.onToolCall?.(tc);
            handlers.onToolResult?.({ callId: id, name, output: '(Completed)', failed: false });
          }
        } else if (clean.startsWith('Thinking:') || clean.startsWith('<thinking>')) {
          thinking += clean + '\n';
          handlers.onThinking(clean + '\n');
        } else {
          text += (text ? '\n' : '') + clean;
          handlers.onText(clean + '\n');
        }
      });

      child.stderr?.on('data', (chunk) => { stderrText += chunk.toString(); });
      child.on('error', (err) => { signal.removeEventListener('abort', onAbort); reject(new Error(`Claude Code process error: ${err.message}`)); });
      child.on('close', (code) => {
        signal.removeEventListener('abort', onAbort);
        if (code !== 0 && !text) {
          return reject(new Error(`Claude Code exited with code ${code}: ${stderrText.slice(0, 500) || 'Execution failed'}`));
        }
        this.turns.push({ role: 'model', text: text.trim() });
        resolve({ text: text.trim(), thinking, toolCalls, finishReason: 'STOP' });
      });
    });
  }

  public appendToolResults(results: ModelToolResult[]) {
    const formatted = results.map((r) => `[Tool: ${r.name}] -> ${r.failed ? 'ERROR: ' : ''}${r.output}`).join('\n');
    this.turns.push({ role: 'user', text: `[Tool Execution Results]\n${formatted}` });
  }

  public appendUserText(text: string) {
    const last = this.turns[this.turns.length - 1];
    if (last?.role === 'user') last.text += `\n${text}`;
    else this.turns.push({ role: 'user', text });
  }

  private buildPromptPayload(): string {
    const parts: string[] = [];
    if (this.systemInstruction) parts.push(`[SYSTEM INSTRUCTION]\n${this.systemInstruction}\n`);
    for (const t of this.turns) parts.push(`[${t.role === 'user' ? 'User' : 'Assistant'}]\n${t.text}`);
    return parts.join('\n\n');
  }
}
