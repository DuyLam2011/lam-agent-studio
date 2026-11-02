import fs from 'fs/promises';
import fsSync from 'fs';
import { exec } from 'child_process';
import { simpleGit } from 'simple-git';
import { FileSecurityHarness } from '../../services/FileSecurityHarness';
import { SurgicalPatchEngine } from '../../services/SurgicalPatchEngine';
import { NodeReplEngine } from '../../services/NodeReplEngine';
import { browserInspectionService } from '../../services/BrowserInspectionService';
import { MultiTierVerifier } from '../../services/MultiTierVerifier';
import { searchWorkspace } from './searchWorkspace';
import { ToolFileMutator } from './ToolFileMutator';
import { ToolSkillReader } from './ToolSkillReader';
import type { DiffSnapshot, SecurityMode, ToolExecutionOutcome } from '../types';

const COMMAND_TIMEOUT_MS = 120_000;
const GIT_BASH = 'C:\\Program Files\\Git\\bin\\bash.exe';

export class ToolExecutor {
  private diffSnapshots: DiffSnapshot[] = [];

  constructor(private workspaceRoot: string) {}

  public setWorkspaceRoot(dir: string) { if (dir) this.workspaceRoot = dir; }
  public getWorkspaceRoot(): string { return this.workspaceRoot; }
  public getDiffSnapshots(): DiffSnapshot[] { return [...this.diffSnapshots]; }
  public resetDiffSnapshots() { this.diffSnapshots = []; }

  public async execute(name: string, args: any, securityMode?: string, signal?: AbortSignal): Promise<ToolExecutionOutcome> {
    const startTime = Date.now();
    const mode = (securityMode as SecurityMode) || 'guarded';
    try {
      const result = await this.dispatch(name, args || {}, mode, signal);
      return { status: 'success', result, executionTimeMs: Date.now() - startTime };
    } catch (err: any) {
      return { status: 'failed', result: err?.message || 'Tool execution failed', executionTimeMs: Date.now() - startTime };
    }
  }

  private async dispatch(name: string, args: any, mode: SecurityMode, signal?: AbortSignal): Promise<any> {
    switch (name) {
      case 'read_file': {
        const chk = ToolFileMutator.check(this.workspaceRoot, args.path, 'read', mode);
        const raw = await fs.readFile(chk.resolvedPath, 'utf-8');
        return SurgicalPatchEngine.formatWindowedContent(raw, args.startLine, args.endLine);
      }
      case 'write_file': {
        const { result, snapshot } = await ToolFileMutator.writeFile(this.workspaceRoot, args, mode);
        this.diffSnapshots.push(snapshot);
        return result;
      }
      case 'edit_file': {
        const { result, snapshot } = await ToolFileMutator.editFile(this.workspaceRoot, args, mode);
        this.diffSnapshots.push(snapshot);
        return result;
      }
      case 'run_command': return this.runCommand(String(args.command || ''), mode, signal);
      case 'list_directory': {
        const chk = ToolFileMutator.check(this.workspaceRoot, args.path || '.', 'read', mode);
        const items = await fs.readdir(chk.resolvedPath, { withFileTypes: true });
        return items.map((i) => ({ name: i.name, isDirectory: i.isDirectory() }));
      }
      case 'search_files': {
        const chk = ToolFileMutator.check(this.workspaceRoot, args.path || '.', 'read', mode);
        return searchWorkspace({ root: chk.resolvedPath, query: String(args.query || ''), isRegex: Boolean(args.isRegex), maxResults: args.maxResults, signal });
      }
      case 'git_status': {
        const status = await simpleGit(this.workspaceRoot).status();
        return { currentBranch: status.current, modified: status.modified, created: status.created, deleted: status.deleted, staged: status.staged, not_added: status.not_added };
      }
      case 'git_diff': return this.gitDiff(args);
      case 'js':
      case 'node_repl': {
        const code = args.code || args.script || '';
        if (!code) throw new Error('Code argument is required for js/node_repl tool');
        const replRes = await NodeReplEngine.execute(code, this.workspaceRoot);
        if (!replRes.success) throw new Error(replRes.output);
        return replRes.output;
      }
      case 'browser_navigate': return browserInspectionService.navigate(String(args.url || 'http://localhost:5173'));
      case 'browser_inspect_element': return browserInspectionService.inspectElement(String(args.selector || 'body'));
      case 'browser_screenshot': return browserInspectionService.captureScreenshot();
      case 'browser_console_logs': return browserInspectionService.getConsoleLogs();
      case 'browser_eval': return browserInspectionService.evaluateScript(String(args.code || ''));
      case 'read_skill': return ToolSkillReader.readSkill(this.workspaceRoot, String(args?.skillName || args?.name || ''));
      case 'verify_project_invariants': {
        const touched = this.diffSnapshots.map((d) => d.relativePath);
        const report = await MultiTierVerifier.verifyAllTiers(this.workspaceRoot, {
          skipBuild: Boolean(args?.skipBuild),
          testFilter: args?.testFilter,
          targetFiles: args?.targetFiles || touched
        });
        return report.formattedReport;
      }
      default: throw new Error(`Unknown tool: ${name}`);
    }
  }

  private runCommand(command: string, mode: SecurityMode, signal?: AbortSignal): Promise<string> {
    if (!command.trim()) throw new Error('command is required');
    const cmdChk = FileSecurityHarness.checkCommandPermission(command, mode);
    if (!cmdChk.allowed) throw new Error(cmdChk.reason);

    const isWin = process.platform === 'win32';
    const cmdToRun = isWin && fsSync.existsSync(GIT_BASH)
      ? `"${GIT_BASH}" -l -c ${JSON.stringify(command)}`
      : (isWin && !command.trim().startsWith('cmd /c') ? `cmd /c "${command}"` : command);

    return new Promise((resolve) => {
      exec(cmdToRun, { cwd: this.workspaceRoot, timeout: COMMAND_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024, signal }, (error, stdout, stderr) => {
        if (error) {
          const reason = (error as any).killed ? `Process terminated (timeout ${COMMAND_TIMEOUT_MS / 1000}s or cancelled)` : error.message;
          resolve(`Exit Code: ${error.code ?? 1}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr || reason}`);
        } else {
          resolve(`Exit Code: 0\n${stdout || stderr || '(No output)'}`);
        }
      });
    });
  }

  private async gitDiff(args: any): Promise<string> {
    const git = simpleGit(this.workspaceRoot);
    const diffArgs: string[] = [];
    if (args?.staged) diffArgs.push('--staged');
    if (args?.path) diffArgs.push('--', args.path);
    let diffOutput = '';
    try {
      diffOutput = await git.diff(diffArgs);
      if (!diffOutput && !args?.staged && !args?.path) diffOutput = await git.diff(['HEAD~1']);
    } catch (err: any) { diffOutput = `Git diff notice: ${err.message}`; }
    return diffOutput || '(No git diff changes detected in working tree or HEAD~1)';
  }
}
