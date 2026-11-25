import fs from 'fs/promises';
import path from 'path';
import { NodeReplEngine } from './NodeReplEngine';
import { NativeEngineBridge } from './NativeEngineBridge';
import { ToolFileMutator } from '../agent/tools/ToolFileMutator';
import { ExecutionEnvironmentService } from './ExecutionEnvironmentService';
import { DocReaderService } from './DocReaderService';
import { CiCdVerificationService } from './CiCdVerificationService';
import { CiCdLoopOrchestrator } from './CiCdLoopOrchestrator';

export interface CodeModeExecutionOutcome {
  success: boolean;
  output: string;
  rawBytes: number;
  distilledBytes: number;
  tokensSaved: number;
  durationMs: number;
}

export class CodeModeService {
  private static defaultEnabled = true;

  public static isEnabled(): boolean {
    return this.defaultEnabled;
  }

  public static setEnabled(val: boolean): void {
    this.defaultEnabled = val;
  }

  /**
   * Executes a programmatic workflow script, locally orchestrating tools
   * and distilling the output via Rust before sending to the LLM context.
   */
  public static async executeScript(
    script: string,
    workspaceRoot: string,
    actionName = 'Programmatic Workflow'
  ): Promise<CodeModeExecutionOutcome> {
    const start = performance.now();

    const tools = {
      search: async (q: string, isRe = false) => {
        const res = NativeEngineBridge.searchWorkspace(workspaceRoot, q, Boolean(isRe), 50);
        return res ? res.matches.map(m => `${m.filePath}:${m.lineNumber}`) : [];
      },
      read: async (filePath: string, s?: number, e?: number) => {
        const full = path.resolve(workspaceRoot, filePath);
        const content = await fs.readFile(full, 'utf-8');
        const lines = content.split('\n');
        return lines.slice((s && s > 0 ? s - 1 : 0), (e && e > 0 ? e : lines.length)).join('\n');
      },
      write: async (filePath: string, content: string) => {
        const chk = ToolFileMutator.check(workspaceRoot, filePath, 'write', 'guarded');
        await fs.writeFile(chk.resolvedPath, content, 'utf-8');
        return { written: chk.relativePath, bytes: content.length };
      },
      patch: async (filePath: string, target: string, replacement: string) => {
        const chk = ToolFileMutator.check(workspaceRoot, filePath, 'write', 'guarded');
        const original = await fs.readFile(chk.resolvedPath, 'utf-8');
        const res = NativeEngineBridge.applyPatch(original, target, replacement);
        await fs.writeFile(chk.resolvedPath, res.updatedContent, 'utf-8');
        return { patched: chk.relativePath, type: res.matchType, added: res.linesAdded, removed: res.linesRemoved };
      },
      bash: async (command: string) => {
        const res = await ExecutionEnvironmentService.executeAgentCommand({
          command, workspaceRoot, streamToTerminal: false, agentName: 'CodeMode Engine'
        });
        return { exitCode: res.exitCode, output: (res.stdout || res.stderr || '').trim() };
      },
      readDoc: async (target: string, query?: string) => {
        return DocReaderService.readDoc(workspaceRoot, { [target.startsWith('http') ? 'url' : 'path']: target, query });
      },
      verifyCiCd: async (opts?: any) => {
        return CiCdVerificationService.runFullAudit(workspaceRoot, opts || {});
      },
      runCiCdLoop: async (opts?: any) => {
        return CiCdLoopOrchestrator.executeSelfHealingLoop(workspaceRoot, opts || {});
      }
    };

    try {
      const replRes = await NodeReplEngine.execute(script, workspaceRoot, 25000, { tools });
      const rawText = replRes.output !== undefined
        ? (typeof replRes.output === 'object' ? JSON.stringify(replRes.output, null, 2) : String(replRes.output))
        : replRes.logs.join('\n') || '(Workflow completed with zero return payload)';

      const distilled = NativeEngineBridge.distillCodeModeOutput(rawText, 50);
      const elapsed = performance.now() - start;
      const envelope = NativeEngineBridge.formatCodeModeEnvelope(
        actionName,
        replRes.success ? 'success' : 'failed',
        distilled.distilledOutput,
        distilled.estimatedTokensSaved,
        elapsed
      );

      return {
        success: replRes.success,
        output: envelope,
        rawBytes: distilled.rawBytes,
        distilledBytes: distilled.distilledBytes,
        tokensSaved: distilled.estimatedTokensSaved,
        durationMs: elapsed
      };
    } catch (err: any) {
      const elapsed = performance.now() - start;
      return {
        success: false,
        output: `[⚡ Code Mode Failed]: ${err?.message || String(err)}`,
        rawBytes: 0,
        distilledBytes: 0,
        tokensSaved: 0,
        durationMs: elapsed
      };
    }
  }
}
