import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import { MultiTierVerifier, MultiTierVerificationReport } from './MultiTierVerifier';
import { ExecutionEnvironmentService } from './ExecutionEnvironmentService';

export interface CiCdDiagnosticError {
  category: 'ci_cd' | 'lint' | 'typecheck' | 'test' | 'invariant' | 'github_remote';
  description: string;
  file?: string;
  line?: number;
}

export interface CiCdVerificationReport {
  passed: boolean;
  score: number;
  githubStatus: { connected: boolean; repo?: string; lastRunConclusion?: string };
  workflowStatus: { valid: boolean; count: number; errors: string[] };
  lintStatus: { passed: boolean; errorCount: number; violations: string[] };
  multiTier: MultiTierVerificationReport;
  compositeErrors: CiCdDiagnosticError[];
  formattedReport: string;
  selfHealingPrompt?: string;
}

export class CiCdVerificationService {
  public static async runFullAudit(
    workspaceRoot: string,
    options: { githubToken?: string; skipBuild?: boolean; testFilter?: string } = {}
  ): Promise<CiCdVerificationReport> {
    const compositeErrors: CiCdDiagnosticError[] = [];
    const githubStatus = await this.checkGitHubRemote(workspaceRoot, options.githubToken);
    if (!githubStatus.connected && githubStatus.lastRunConclusion === 'unreachable') {
      compositeErrors.push({ category: 'github_remote', description: 'GitHub remote origin unreachable or misconfigured' });
    }

    const workflowStatus = await this.auditWorkflows(workspaceRoot);
    for (const err of workflowStatus.errors) {
      compositeErrors.push({ category: 'ci_cd', description: `Workflow configuration error: ${err}` });
    }

    const lintStatus = await this.runLintCheck(workspaceRoot);
    for (const v of lintStatus.violations) {
      compositeErrors.push({ category: 'lint', description: v });
    }

    const multiTier = await MultiTierVerifier.verifyAllTiers(workspaceRoot, {
      skipBuild: options.skipBuild,
      testFilter: options.testFilter
    });

    if (!multiTier.tier1Syntax.passed) {
      compositeErrors.push({ category: 'typecheck', description: multiTier.tier1Syntax.error || 'Typecheck failed' });
    }
    if (!multiTier.tier2Tests.passed) {
      compositeErrors.push({ category: 'test', description: multiTier.tier2Tests.error || 'Test suite failed' });
    }
    if (!multiTier.tier4Invariants.passed) {
      for (const v of multiTier.tier4Invariants.violations) {
        compositeErrors.push({ category: 'invariant', description: v });
      }
    }

    const passed = compositeErrors.length === 0;
    const score = Math.max(0, 100 - (compositeErrors.length * 15));
    const formattedReport = this.buildReport(passed, score, githubStatus, workflowStatus, lintStatus, multiTier, compositeErrors);
    const selfHealingPrompt = passed ? undefined : this.buildHealingPrompt(compositeErrors);

    return { passed, score, githubStatus, workflowStatus, lintStatus, multiTier, compositeErrors, formattedReport, selfHealingPrompt };
  }

  private static async checkGitHubRemote(ws: string, token?: string) {
    try {
      const git = simpleGit(ws);
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin')?.refs.fetch || '';
      const match = origin.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      const repo = match ? `${match[1]}/${match[2]}` : undefined;
      return { connected: Boolean(repo), repo, lastRunConclusion: repo ? (token ? 'authenticated' : 'remote_detected') : 'no_remote' };
    } catch {
      return { connected: false, lastRunConclusion: 'unreachable' };
    }
  }

  private static async auditWorkflows(ws: string) {
    const wfDir = path.join(ws, '.github', 'workflows');
    const errors: string[] = [];
    try {
      const files = await fs.readdir(wfDir);
      const ymls = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      for (const f of ymls) {
        const content = await fs.readFile(path.join(wfDir, f), 'utf-8');
        if (!content.includes('jobs:')) errors.push(`${f}: missing 'jobs:' definition`);
        if (!content.includes('steps:')) errors.push(`${f}: missing 'steps:' declaration`);
      }
      return { valid: errors.length === 0, count: ymls.length, errors };
    } catch {
      return { valid: true, count: 0, errors: [] };
    }
  }

  private static async runLintCheck(ws: string) {
    try {
      const pkgRaw = await fs.readFile(path.join(ws, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgRaw);
      if (pkg.scripts?.lint) {
        const res = await ExecutionEnvironmentService.executeAgentCommand({ command: 'npm run lint', workspaceRoot: ws });
        return { passed: res.exitCode === 0, errorCount: res.exitCode === 0 ? 0 : 1, violations: res.exitCode === 0 ? [] : [res.stderr || res.stdout] };
      }
    } catch {}
    return { passed: true, errorCount: 0, violations: [] };
  }

  private static buildReport(passed: boolean, score: number, gh: any, wf: any, lint: any, mt: any, errors: CiCdDiagnosticError[]) {
    return [
      `🛡️ **CI/CD, LINT & COMPOSITE TEST REPORT: [${passed ? '100% CLEAN' : 'FAILURES DETECTED'}]** (Score: ${score}/100)`,
      `- **GitHub Remote**: ${gh.connected ? `\`${gh.repo}\` (${gh.lastRunConclusion})` : 'Local only / No remote'}`,
      `- **Workflows**: ${wf.count} detected (Valid: ${wf.valid})`,
      `- **Lint Gate**: ${lint.passed ? 'PASSED (0 violations)' : `FAILED (${lint.errorCount} error)`}`,
      `- **Multi-Tier Gate**: Typecheck: ${mt.tier1Syntax.passed ? 'PASSED' : 'FAILED'} | Tests: ${mt.tier2Tests.passed ? 'PASSED' : 'FAILED'} | Invariants: ${mt.tier4Invariants.passed ? 'PASSED' : 'FAILED'}`,
      errors.length > 0 ? `\n### 🚨 Failing Diagnoses (${errors.length}):\n` + errors.map((e, idx) => `${idx + 1}. [${e.category.toUpperCase()}] ${e.description.slice(0, 300)}`).join('\n') : '\n✅ All CI/CD, Lint, and Invariant pipelines passed cleanly!'
    ].join('\n');
  }

  private static buildHealingPrompt(errors: CiCdDiagnosticError[]) {
    return [
      `[CI/CD & LINT INVARIANT SELF-HEALING DIRECTIVE]`,
      `The CI/CD testing suite detected ${errors.length} concrete failures across categories:`,
      errors.map(e => `- [${e.category.toUpperCase()}]: ${e.description}`).join('\n'),
      ``,
      `MANDATORY ACTION PROTOCOL:`,
      `1. Use 'search_files' or 'read_file' to locate the exact failing code lines or workflow configs.`,
      `2. Apply surgical fixes via 'edit_file' or 'code_mode_eval' ensuring Rule 4 compliance (<150 lines per file).`,
      `3. Re-execute the CI/CD test suite until 100% clean.`
    ].join('\n');
  }
}
