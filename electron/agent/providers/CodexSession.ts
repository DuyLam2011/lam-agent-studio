import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import { codexAccountService } from '../../services/CodexAccountService';
import type { NormalizedTurn } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolResult, ModelTurnResult } from '../types';

export interface CodexSessionConfig {
  model: string;
  systemInstruction?: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens?: number;
}

export class CodexSession implements ModelSession {
  public readonly provider = 'codex' as const;
  public readonly model: string;
  private turns: NormalizedTurn[];
  private systemInstruction: string;

  constructor(cfg: CodexSessionConfig) {
    this.model = cfg.model || 'gpt-6.1-sol';
    this.turns = [...cfg.turns];
    this.systemInstruction = cfg.systemInstruction || '';
  }

  public async streamTurn(
    handlers: ModelStreamHandlers,
    signal: AbortSignal,
    _opts: { allowTools: boolean }
  ): Promise<ModelTurnResult> {
    const binPath = codexAccountService.getBinaryPath();
    const promptPayload = this.buildPromptPayload();

    return new Promise<ModelTurnResult>((resolve, reject) => {
      const args = [
        'exec',
        '-m', this.model,
        '--json',
        '--ephemeral',
        '--skip-git-repo-check',
        promptPayload
      ];

      let child: ChildProcess;
      try {
        child = spawn(binPath, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
        child.stdin?.end();
      } catch (err) {
        return reject(new Error(`Failed to spawn Codex binary at ${binPath}: ${err}`));
      }

      let text = '';
      let thinking = '';
      let stderrText = '';

      const onAbort = () => {
        try { child.kill('SIGTERM'); } catch {}
        reject(new Error('Codex run aborted by user'));
      };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });

      const rl = readline.createInterface({ input: child.stdout!, crlfDelay: Infinity });

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) return;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.type === 'item.completed' && parsed.item) {
            const item = parsed.item;
            if (item.type === 'agent_message' && item.text) {
              text += item.text;
              handlers.onText(item.text);
            } else if (item.type === 'reasoning' && item.text) {
              thinking += item.text;
              handlers.onThinking(item.text);
            }
          }
        } catch {}
      });

      child.stderr?.on('data', (chunk) => {
        stderrText += chunk.toString();
      });

      child.on('error', (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(new Error(`Codex process error: ${err.message}`));
      });

      child.on('close', (code) => {
        signal.removeEventListener('abort', onAbort);
        if (code !== 0 && !text) {
          return reject(new Error(`Codex exited with code ${code}: ${stderrText.slice(0, 500) || 'Unknown error'}`));
        }
        this.turns.push({ role: 'model', text });
        resolve({ text, thinking, toolCalls: [], finishReason: 'STOP' });
      });
    });
  }

  public appendToolResults(results: ModelToolResult[]) {
    const formatted = results
      .map((r) => `[Tool: ${r.name}] -> ${r.failed ? 'ERROR: ' : ''}${r.output}`)
      .join('\n');
    this.turns.push({ role: 'user', text: `[Tool Execution Results]\n${formatted}` });
  }

  public appendUserText(text: string) {
    const last = this.turns[this.turns.length - 1];
    if (last?.role === 'user') {
      last.text += `\n${text}`;
    } else {
      this.turns.push({ role: 'user', text });
    }
  }

  private buildPromptPayload(): string {
    const parts: string[] = [];
    if (this.systemInstruction) {
      parts.push(`[SYSTEM INSTRUCTION]\n${this.systemInstruction}\n`);
    }
    for (const t of this.turns) {
      const prefix = t.role === 'user' ? 'User' : 'Assistant';
      parts.push(`[${prefix}]\n${t.text}`);
    }
    return parts.join('\n\n');
  }
}
