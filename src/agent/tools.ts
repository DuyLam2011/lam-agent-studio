import fs from 'fs/promises';
import path from 'path';
import { PatchEngine } from './tools/patch-engine';
import { CommandRunner } from './tools/command-runner';
import { GitInspector } from './tools/git-inspector';
import { ProjectVerifier } from './tools/project-verifier';
import { WorkspaceScanner } from './tools/workspace-scanner';
import {
  ReadFileRangeArgs,
  PatchFileArgs,
  RunCommandArgs,
  ListWorkspaceArgs,
  ToolResult,
  ProjectVerificationResult,
  GitStatusSummary,
  AgentFileDiffSnapshot
} from './types';

export class AgentTools {
  private workspaceRoot: string;
  private commandRunner: CommandRunner;
  private gitInspector: GitInspector;
  private projectVerifier: ProjectVerifier;
  private scanner: WorkspaceScanner;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.commandRunner = new CommandRunner(this.workspaceRoot);
    this.gitInspector = new GitInspector(this.workspaceRoot);
    this.projectVerifier = new ProjectVerifier(this.workspaceRoot);
    this.scanner = new WorkspaceScanner(this.workspaceRoot);
  }

  public resolveSafePath(inputPath: string): string {
    const resolved = path.isAbsolute(inputPath)
      ? path.resolve(inputPath)
      : path.resolve(this.workspaceRoot, inputPath);
    const rel = path.relative(this.workspaceRoot, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`[SECURITY] Access denied to path outside workspace: '${inputPath}'`);
    }
    return resolved;
  }

  public async read_file_range(args: ReadFileRangeArgs): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const fullPath = this.resolveSafePath(args.filePath);
      const raw = await fs.readFile(fullPath, 'utf-8');
      const lines = raw.split(/\r?\n/);

      const hasRange = args.startLine !== undefined || args.endLine !== undefined;
      const start = Math.max(1, args.startLine ?? 1);
      const end = Math.min(lines.length, hasRange ? (args.endLine ?? lines.length) : Math.min(lines.length, 200));

      const padWidth = Math.max(3, String(end).length);
      const formatted = lines
        .slice(start - 1, end)
        .map((line, idx) => `${String(start + idx).padStart(padWidth, ' ')} | ${line}`)
        .join('\n');

      const relPath = path.relative(this.workspaceRoot, fullPath);
      return {
        success: true,
        output: `[File: ${relPath} (Lines ${start}-${end} of ${lines.length})]\n${formatted}`,
        executionTimeMs: Date.now() - startTime,
        metadata: { totalLines: lines.length, startLine: start, endLine: end, filePath: fullPath }
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }

  public async inspect_git_status(): Promise<ToolResult<GitStatusSummary>> {
    return this.gitInspector.inspect();
  }

  public async verify_project(customCommand?: string): Promise<ProjectVerificationResult> {
    return this.projectVerifier.verify(customCommand);
  }

  public async patch_file(args: PatchFileArgs): Promise<ToolResult<AgentFileDiffSnapshot>> {
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
          originalContent: original,
          newContent: res.updatedContent,
          linesAdded: res.linesAdded,
          linesRemoved: res.linesRemoved
        }
      };
    } catch (err: any) {
      return { success: false, output: '', error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }

  public async run_command(args: RunCommandArgs): Promise<ToolResult> {
    const startTime = Date.now();
    const res = await this.commandRunner.run(args.command, args.timeoutMs || 30000);
    return {
      success: res.exitCode === 0,
      output: res.exitCode === 0 ? res.stdout || 'Command completed with 0 exit code.' : `[EXIT ${res.exitCode}]\n${res.stderr || res.stdout}`,
      executionTimeMs: Date.now() - startTime,
      metadata: { stdout: res.stdout, stderr: res.stderr, exitCode: res.exitCode }
    };
  }

  public async list_workspace(args: ListWorkspaceArgs = {}): Promise<ToolResult> {
    return this.scanner.scan(args, (p) => this.resolveSafePath(p));
  }
}
