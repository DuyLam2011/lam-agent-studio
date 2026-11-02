import fs from 'fs/promises';
import path from 'path';
import { FileSecurityHarness } from '../../services/FileSecurityHarness';
import { SurgicalPatchEngine } from '../../services/SurgicalPatchEngine';
import type { DiffSnapshot, SecurityMode } from '../types';

const newDiffId = () => `diff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export class ToolFileMutator {
  public static check(workspaceRoot: string, inputPath: string, action: 'read' | 'write', mode: SecurityMode) {
    if (!inputPath || typeof inputPath !== 'string') throw new Error('A valid "path" argument is required');
    const chk = FileSecurityHarness.validatePath(workspaceRoot, inputPath, action, mode);
    if (!chk.allowed) throw new Error(chk.reason);
    return chk;
  }

  public static async writeFile(
    workspaceRoot: string,
    args: any,
    mode: SecurityMode
  ): Promise<{ result: string; snapshot: DiffSnapshot }> {
    const chk = this.check(workspaceRoot, args.path, 'write', mode);
    const content = typeof args.content === 'string' ? args.content : '';
    let originalContent = '';
    let action: 'modified' | 'created' = 'created';
    try {
      originalContent = await fs.readFile(chk.resolvedPath, 'utf-8');
      action = 'modified';
    } catch { /* new file */ }

    await fs.mkdir(path.dirname(chk.resolvedPath), { recursive: true });
    await fs.writeFile(chk.resolvedPath, content, 'utf-8');

    const linesAdded = content ? content.split('\n').length : 0;
    const linesRemoved = originalContent ? originalContent.split('\n').length : 0;
    const snapshot: DiffSnapshot = {
      id: newDiffId(), filePath: chk.resolvedPath, relativePath: chk.relativePath, action,
      originalContent, newContent: content, linesAdded, linesRemoved, timestamp: Date.now()
    };

    let result = `Successfully wrote ${content.length} characters to ${chk.relativePath}`;
    if (linesAdded > 150) result += ` [ADVISORY: File has ${linesAdded} lines. Consider modularizing into <150 line sub-modules.]`;
    return { result, snapshot };
  }

  public static async editFile(
    workspaceRoot: string,
    args: any,
    mode: SecurityMode
  ): Promise<{ result: string; snapshot: DiffSnapshot }> {
    const chk = this.check(workspaceRoot, args.path, 'write', mode);
    const current = await fs.readFile(chk.resolvedPath, 'utf-8');
    const patchRes = SurgicalPatchEngine.applySurgicalEdit(current, args.targetContent, args.replacementContent);
    await fs.writeFile(chk.resolvedPath, patchRes.updatedContent, 'utf-8');

    const snapshot: DiffSnapshot = {
      id: newDiffId(), filePath: chk.resolvedPath, relativePath: chk.relativePath, action: 'modified',
      originalContent: current, newContent: patchRes.updatedContent,
      linesAdded: patchRes.linesAdded, linesRemoved: patchRes.linesRemoved, timestamp: Date.now()
    };

    const result = `Successfully patched ${chk.relativePath} (${patchRes.matchType}, +${patchRes.linesAdded}/-${patchRes.linesRemoved} lines)`;
    return { result, snapshot };
  }
}
