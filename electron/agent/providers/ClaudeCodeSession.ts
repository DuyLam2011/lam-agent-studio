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
  reasoningEffort?: string;
}

export class ClaudeCodeSession implements ModelSession {
  public readonly provider = 'claudecode' as const;
  public readonly model: string;
  private turns: NormalizedTurn[];
  private systemInstruction: string;
  private reasoningEffort: string;

  constructor(cfg: ClaudeCodeSessionConfig) {
    this.model = (cfg.model || '').toLowerCase().startsWith('claude') ? cfg.model : 'claude-3-7-sonnet';
    this.turns = [...cfg.turns];
    this.systemInstruction = cfg.systemInstruction || '';
    this.reasoningEffort = cfg.reasoningEffort || 'medium';
  }

  public async streamTurn(handlers: ModelStreamHandlers, signal: AbortSignal, _opts: { allowTools: boolean }): Promise<ModelTurnResult> {
    const promptPayload = this.buildPromptPayload();
    return new Promise<ModelTurnResult>((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? 'npx.cmd' : 'npx';
      const args = ['@anthropic-ai/claude-code', '-p', '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions', '--model', this.model];
      const thinkingBudget = this.reasoningEffort === 'off' ? '0' : this.reasoningEffort === 'low' ? '2048' : this.reasoningEffort === 'high' ? '12288' : '6144';

      let child: ChildProcess;
      try {
        child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: isWin, env: { ...process.env, MAX_THINKING_TOKENS: thinkingBudget } });
        child.stdin?.write(promptPayload);
        child.stdin?.end();
      } catch (err) {
        return reject(new Error(`Failed to spawn Claude Code runtime: ${err}`));
      }

      let text = '', thinking = '', stderrText = '';
      const toolCalls: ModelToolCall[] = [];
      const seenTools = new Set<string>();
      const onAbort = () => { try { child.kill('SIGTERM'); } catch {} reject(new Error('Claude Code run aborted by user')); };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });

      const rl = readline.createInterface({ input: child.stdout!, crlfDelay: Infinity });
      rl.on('line', (line) => {
        const clean = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
        if (!clean || clean.includes('Safe-chain:') || clean.includes('Claude Code ignored') || clean.includes('Warning: no stdin data')) return;

        if (clean.startsWith('{')) {
          try {
            const ev = JSON.parse(clean);
            const contents = ev?.message?.content;
            if (Array.isArray(contents)) {
              for (const blk of contents) {
                if (blk.type === 'thinking' && blk.thinking) { thinking += blk.thinking; handlers.onThinking(blk.thinking); }
                else if (blk.type === 'text' && blk.text) { text += blk.text; handlers.onText(blk.text); }
                else if (blk.type === 'tool_use' && blk.name && !seenTools.has(blk.id || blk.name)) {
                  const id = blk.id || `claude-tool-${toolCalls.length + 1}`;
                  seenTools.add(id);
                  const tc: ModelToolCall = { id, name: blk.name === 'Bash' ? 'run_command' : blk.name, args: blk.input || {} };
                  toolCalls.push(tc);
                  handlers.onToolCall?.(tc);
                  handlers.onToolResult?.({ callId: id, name: tc.name, output: '(Completed)', failed: false });
                }
              }
              return;
            }
            if (ev.type === 'result' && typeof ev.result === 'string' && !text) { text = ev.result; handlers.onText(ev.result); }
            return;
          } catch {}
        }

        if (clean.startsWith('Thinking:') || clean.startsWith('<thinking>')) {
          thinking += clean + '\n'; handlers.onThinking(clean + '\n');
        } else if (clean.startsWith('Running ') || clean.startsWith('Read ') || clean.startsWith('Edit ') || clean.startsWith('Bash:')) {
          const id = `claude-tool-${Date.now()}-${toolCalls.length}`;
          if (!seenTools.has(clean)) {
            seenTools.add(clean);
            const isCmd = clean.startsWith('Running ') || clean.startsWith('Bash:');
            const name = isCmd ? 'run_command' : clean.startsWith('Edit ') ? 'edit_file' : 'read_file';
            const tc: ModelToolCall = { id, name, args: isCmd ? { command: clean.replace(/^(Running|Bash:)\s*/, '') } : { path: clean.replace(/^(Edit|Read)\s*/, '') } };
            toolCalls.push(tc); handlers.onToolCall?.(tc); handlers.onToolResult?.({ callId: id, name, output: '(Completed)', failed: false });
          }
        } else {
          text += (text ? '\n' : '') + clean; handlers.onText(clean + '\n');
        }
      });

      child.stderr?.on('data', (chunk) => { stderrText += chunk.toString(); });
      child.on('error', (err) => { signal.removeEventListener('abort', onAbort); reject(new Error(`Claude Code process error: ${err.message}`)); });
      child.on('close', (code) => {
        signal.removeEventListener('abort', onAbort);
        if (code !== 0 && !text) return reject(new Error(`Claude Code exited with code ${code}: ${stderrText.slice(0, 500) || 'Execution failed'}`));
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
