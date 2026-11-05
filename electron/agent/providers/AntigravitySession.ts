import { spawn, ChildProcess } from 'child_process';
import readline from 'readline';
import { googleAccountService } from '../../services/GoogleAccountService';
import type { NormalizedTurn } from '../context/historyBuilder';
import type { ModelSession, ModelStreamHandlers, ModelToolResult, ModelTurnResult } from '../types';

export interface AntigravitySessionConfig {
  model: string;
  systemInstruction?: string;
  turns: NormalizedTurn[];
  temperature?: number;
  maxOutputTokens?: number;
}

export class AntigravitySession implements ModelSession {
  public readonly provider = 'antigravity' as const;
  public readonly model: string;
  private turns: NormalizedTurn[];
  private systemInstruction: string;

  constructor(cfg: AntigravitySessionConfig) {
    this.model = cfg.model || 'gemini-3.8-flash-high';
    this.turns = [...cfg.turns];
    this.systemInstruction = cfg.systemInstruction || '';
  }

  public async streamTurn(
    handlers: ModelStreamHandlers,
    signal: AbortSignal,
    _opts: { allowTools: boolean }
  ): Promise<ModelTurnResult> {
    const binPath = googleAccountService.getBinaryPath();
    const promptPayload = this.buildPromptPayload();

    return new Promise<ModelTurnResult>((resolve, reject) => {
      const args = [
        '-p', promptPayload,
        '--output-format', 'stream-json',
        '--model', this.model,
        '--dangerously-skip-permissions',
        '--disable-slash-commands'
      ];

      let child: ChildProcess;
      try {
        child = spawn(binPath, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
      } catch (err) {
        return reject(new Error(`Failed to spawn Antigravity binary at ${binPath}: ${err}`));
      }

      let text = '';
      let thinking = '';
      let stderrText = '';

      const onAbort = () => {
        try { child.kill('SIGTERM'); } catch {}
        reject(new Error('Antigravity run aborted by user'));
      };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });

      const rl = readline.createInterface({ input: child.stdout!, crlfDelay: Infinity });

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) return;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.event === 'step_update' && parsed.step_update) {
            const su = parsed.step_update;
            if (su.text_delta) {
              text += su.text_delta;
              handlers.onText(su.text_delta);
            }
            if (su.thought_delta) {
              thinking += su.thought_delta;
              handlers.onThinking(su.thought_delta);
            }
          } else if (parsed.event === 'result' && parsed.result?.response) {
            if (!text) {
              text = parsed.result.response;
              handlers.onText(text);
            }
          }
        } catch {
          // ignore invalid non-JSON lines
        }
      });

      child.stderr?.on('data', (chunk) => {
        stderrText += chunk.toString();
      });

      child.on('error', (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(new Error(`Antigravity process error: ${err.message}`));
      });

      child.on('close', (code) => {
        signal.removeEventListener('abort', onAbort);
        if (code !== 0 && !text) {
          return reject(new Error(`Antigravity exited with code ${code}: ${stderrText.slice(0, 500) || 'Unknown error'}`));
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
