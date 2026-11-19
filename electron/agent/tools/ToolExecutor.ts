import fs from 'fs/promises';
import { FileSecurityHarness } from '../../services/FileSecurityHarness';
import { SurgicalPatchEngine } from '../../services/SurgicalPatchEngine';
import { NodeReplEngine } from '../../services/NodeReplEngine';
import { browserInspectionService } from '../../services/BrowserInspectionService';
import { webPerformanceAuditService } from '../../services/WebPerformanceAuditService';
import { MultiTierVerifier } from '../../services/MultiTierVerifier';
import { ExecutionEnvironmentService } from '../../services/ExecutionEnvironmentService';
import { GraphifyStudioService } from '../../services/GraphifyStudioService';
import { searchWorkspace } from './searchWorkspace';
import { ToolFileMutator } from './ToolFileMutator';
import { ToolSkillReader } from './ToolSkillReader';
import { ToolGitDiffHelper } from './ToolGitDiffHelper';
import { ToolSubagentDelegator } from './ToolSubagentDelegator';
import { simpleGit } from 'simple-git';
import type { DiffSnapshot, SecurityMode, ToolExecutionOutcome } from '../types';

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
      case 'delegate_to_subagent': return ToolSubagentDelegator.delegate(this.workspaceRoot, args);
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
      case 'git_diff': return ToolGitDiffHelper.diff(this.workspaceRoot, args);
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
      case 'audit_web_performance': {
        const audit = await webPerformanceAuditService.auditPage(args?.url ? String(args.url) : undefined);
        return audit.markdownReport;
      }
      case 'summarize_web_ui': {
        const audit = await webPerformanceAuditService.auditPage(args?.url ? String(args.url) : undefined);
        return `[UI Summary: ${audit.url}]\nTitle: "${audit.domSummary.title}"\nLandmarks: ${audit.domSummary.semanticTagsFound.join(', ')}\nControls: ${audit.domSummary.interactiveCounts.buttons} Buttons, ${audit.domSummary.interactiveCounts.links} Links, ${audit.domSummary.interactiveCounts.inputs} Inputs\nAccessibility Score: ${audit.accessibilityScore}/100`;
      }
      case 'query_code_graph': {
        const res = await GraphifyStudioService.queryGraph(this.workspaceRoot, String(args?.query || ''));
        return res.retrievalContext;
      }
      case 'recall_agent_memory': {
        const res = await GraphifyStudioService.queryGraph(this.workspaceRoot, String(args?.query || ''));
        return res.linkedMemories.length ? res.linkedMemories.map((m) => `[${m.category.toUpperCase()}] ${m.title}: ${m.content}`).join('\n\n') : 'No directly relevant memories found in graph.';
      }
      case 'build_code_graph': {
        const graph = await GraphifyStudioService.buildCodeGraph(this.workspaceRoot);
        return `Code graph indexed: ${graph.stats.totalFiles} files, ${graph.stats.totalSymbols} symbols, ${graph.stats.totalEdges} relationships.`;
      }
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

  private async runCommand(command: string, mode: SecurityMode, _signal?: AbortSignal): Promise<string> {
    if (!command.trim()) throw new Error('command is required');
    const cmdChk = FileSecurityHarness.checkCommandPermission(command, mode);
    if (!cmdChk.allowed) throw new Error(cmdChk.reason);

    const res = await ExecutionEnvironmentService.executeAgentCommand({
      command,
      workspaceRoot: this.workspaceRoot,
      streamToTerminal: true,
      agentName: 'Tool Executor'
    });

    if (res.exitCode !== 0) {
      return `Exit Code: ${res.exitCode}\nSTDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr || 'Command execution failed'}`;
    }
    return `Exit Code: 0\n${res.stdout || res.stderr || '(No output)'}`;
  }
}
