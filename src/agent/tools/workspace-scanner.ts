import fs from 'fs/promises';
import path from 'path';
import { ListWorkspaceArgs, ToolResult } from '../types';

export class WorkspaceScanner {
  private workspaceRoot: string;
  private ignoreSet = new Set(['node_modules', '.git', 'dist', 'dist-electron', '.next', '.cache', 'out']);

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  public async scan(args: ListWorkspaceArgs = {}, resolveSafePath: (p: string) => string): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const targetDir = args.dirPath ? resolveSafePath(args.dirPath) : this.workspaceRoot;
      const maxDepth = args.maxDepth || 3;

      const walk = async (dir: string, depth: number): Promise<string[]> => {
        if (depth > maxDepth) return [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const list: string[] = [];
        for (const entry of entries) {
          if (this.ignoreSet.has(entry.name)) continue;
          const full = path.join(dir, entry.name);
          const rel = path.relative(this.workspaceRoot, full);
          if (entry.isDirectory()) {
            list.push(`${rel}/`);
            list.push(...(await walk(full, depth + 1)));
          } else {
            list.push(rel);
          }
        }
        return list;
      };

      const files = await walk(targetDir, 1);
      const text = `[Workspace Files (${files.length} items)]\n` +
        files.slice(0, 100).join('\n') +
        (files.length > 100 ? `\n... (${files.length - 100} more)` : '');

      return {
        success: true,
        output: text,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }
}
