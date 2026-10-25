import fsPromises from 'fs/promises';
import path from 'path';
import cp from 'child_process';
import vm from 'vm';
import { createRequire } from 'module';

const customRequire = createRequire(__filename);

export interface NodeReplExecutionResult {
  success: boolean;
  output: any;
  logs: string[];
  executionTimeMs: number;
}

export class NodeReplEngine {
  /**
   * Execute async JavaScript/Node.js code within workspace context with high speed
   */
  public static async execute(
    code: string,
    workspaceRoot: string,
    timeoutMs: number = 20000
  ): Promise<NodeReplExecutionResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    const writtenItems: any[] = [];

    const nodeRepl = {
      write: (data: any) => {
        writtenItems.push(data);
      },
      log: (...args: any[]) => {
        logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      }
    };

    // Helper to run child process inside root
    const run = (exe: string, args: string[] = [], opts: cp.ExecFileOptions = {}) => {
      return new Promise<{ exit: number; stdout: string; stderr: string }>((resolve) => {
        cp.execFile(exe, args, { cwd: workspaceRoot, maxBuffer: 3e6, ...opts }, (error, stdout, stderr) => {
          const exitCode = typeof error?.code === 'number' ? error.code : (error ? 1 : 0);
          resolve({ exit: exitCode, stdout: String(stdout || ''), stderr: String(stderr || '') });
        });
      });
    };

    try {
      // Helper to emulate dynamic import without requiring --experimental-vm-modules
      const dynamicImport = async (specifier: string) => {
        const clean = specifier.replace(/^node:/, '');
        if (clean === 'fs/promises') return fsPromises;
        if (clean === 'path') return path;
        if (clean === 'child_process') return cp;
        if (clean === 'fs') return await import('fs');
        if (clean === 'os') return await import('os');
        try {
          return await import(specifier);
        } catch {
          return customRequire(specifier);
        }
      };

      // Create sandbox context with node builtins pre-exposed
      const sandbox = {
        root: workspaceRoot,
        nodeRepl,
        fs: fsPromises,
        path,
        cp,
        run,
        __dynamicImport: dynamicImport,
        console: {
          log: (...args: any[]) => nodeRepl.log(...args),
          error: (...args: any[]) => nodeRepl.log('[ERR]', ...args),
          warn: (...args: any[]) => nodeRepl.log('[WARN]', ...args)
        },
        Buffer,
        process,
        setTimeout,
        clearTimeout
      };

      const context = vm.createContext(sandbox);

      // Transform `import(...)` into `__dynamicImport(...)` so it works smoothly in standard Node/Electron VM
      const transformedCode = code.replace(/\bimport\s*\(/g, '__dynamicImport(');

      // Wrap code in async IIFE without re-declaring root
      const wrappedCode = `(async () => {
        ${transformedCode}
      })()`;

      const script = new vm.Script(wrappedCode, {
        filename: 'node_repl_session.js'
      });

      // Execute with timeout
      const resultPromise = script.runInContext(context, {
        timeout: timeoutMs,
        displayErrors: true
      });

      const evalResult = await resultPromise;
      const executionTimeMs = Date.now() - startTime;

      let finalOutput: any = undefined;
      if (writtenItems.length > 0) {
        finalOutput = writtenItems.length === 1 ? writtenItems[0] : writtenItems;
      } else if (evalResult !== undefined) {
        finalOutput = evalResult;
      } else if (logs.length > 0) {
        finalOutput = logs.join('\n');
      } else {
        finalOutput = '(Execution completed successfully with no output)';
      }

      return {
        success: true,
        output: finalOutput,
        logs,
        executionTimeMs
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error executing node_repl script: ${err.message || String(err)}`,
        logs,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
