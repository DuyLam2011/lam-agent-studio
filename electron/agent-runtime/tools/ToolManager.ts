import fs from 'fs/promises';
import path from 'path';
import { PatchEngine } from './PatchEngine';
import { CommandRunner } from './CommandRunner';
import { ToolResult, ReadFileArgs, PatchFileArgs, RunCommandArgs, ListWorkspaceArgs } from '../types/tools';

export class ToolManager {
  private workspaceRoot: string;
  private commandRunner: CommandRunner;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.commandRunner = new CommandRunner(this.workspaceRoot);
  }

  public resolveSafePath(inputPath: string): string {
    const resolved = path.isAbsolute(inputPath)
      ? path.resolve(inputPath)
      : path.resolve(this.workspaceRoot, inputPath);

    const relative = path.relative(this.workspaceRoot, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`[SECURITY] Access denied to path outside workspace: '${inputPath}'`);
    }
    return resolved;
  }

  public async readFile(args: ReadFileArgs): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const fullPath = this.resolveSafePath(args.filePath);
      const raw = await fs.readFile(fullPath, 'utf-8');
      const lines = raw.split(/\r?\n/);
      
      const start = Math.max(1, args.startLine || 1);
      const end = Math.min(lines.length, args.endLine || lines.length);

      const formatted = lines
        .slice(start - 1, end)
        .map((line, idx) => `${String(start + idx).padStart(4, ' ')} | ${line}`)
        .join('\n');

      return {
        success: true,
        output: `[File: ${path.relative(this.workspaceRoot, fullPath)} (Lines ${start}-${end} of ${lines.length})]\n${formatted}`,
        executionTimeMs: Date.now() - startTime,
        metadata: { totalLines: lines.length, startLine: start, endLine: end }
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }

  public async patchFile(args: PatchFileArgs): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const fullPath = this.resolveSafePath(args.filePath);
      const original = await fs.readFile(fullPath, 'utf-8');
      const relPath = path.relative(this.workspaceRoot, fullPath);

      const res = PatchEngine.applyPatch(original, args.oldContent, args.newContent, relPath);
      await fs.writeFile(fullPath, res.updatedContent, 'utf-8');

      return {
        success: true,
        output: `Successfully patched ${relPath} (${res.matchType} match, +${res.linesAdded}/-${res.linesRemoved} lines)`,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          filePath: fullPath,
          relativePath: relPath,
          linesAdded: res.linesAdded,
          linesRemoved: res.linesRemoved,
          originalContent: original,
          newContent: res.updatedContent
        }
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }

  public async runCommand(args: RunCommandArgs): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const res = await this.commandRunner.run(args.command, args.timeoutMs);
      const output = `Exit Code: ${res.exitCode}\nSTDOUT:\n${res.stdout || '(empty)'}\nSTDERR:\n${res.stderr || '(empty)'}`;
      return {
        success: res.exitCode === 0,
        output,
        error: res.exitCode !== 0 ? `Command exited with code ${res.exitCode}` : undefined,
        executionTimeMs: res.executionTimeMs,
        metadata: { exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr }
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }

  public async listWorkspace(args: ListWorkspaceArgs = {}): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const targetDir = this.resolveSafePath(args.dirPath || '.');
      const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'build', '.next', '.vscode']);
      
      const scan = async (dir: string, depth: number): Promise<string[]> => {
        if (depth > (args.maxDepth ?? 3)) return [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const results: string[] = [];

        for (const e of entries) {
          if (ignoreDirs.has(e.name)) continue;
          const full = path.join(dir, e.name);
          const rel = path.relative(this.workspaceRoot, full);
          if (e.isDirectory()) {
            results.push(`📁 ${rel}/`);
            results.push(...(await scan(full, depth + 1)));
          } else {
            results.push(`📄 ${rel}`);
          }
        }
        return results;
      };

      const tree = await scan(targetDir, 1);
      return {
        success: true,
        output: `Workspace Structure (${tree.length} items):\n${tree.slice(0, 200).join('\n')}`,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }
}
