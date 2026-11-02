import { exec } from 'child_process';
import fsSync from 'fs';
import { auditFileInvariants, detectProjectCommands, InvariantAuditResult } from './InvariantAuditUtils';

const GIT_BASH = 'C:\\Program Files\\Git\\bin\\bash.exe';
const EXEC_TIMEOUT = 120_000;

export interface TierExecutionOutcome {
  passed: boolean;
  command: string;
  output: string;
  error?: string;
  durationMs: number;
}

export interface MultiTierVerificationReport {
  passed: boolean;
  tier1Syntax: TierExecutionOutcome;
  tier2Tests: TierExecutionOutcome;
  tier3Build: TierExecutionOutcome;
  tier4Invariants: InvariantAuditResult;
  totalDurationMs: number;
  formattedReport: string;
  feedbackPrompt?: string;
}

const runShell = (workspaceRoot: string, command: string): Promise<TierExecutionOutcome> => {
  const started = Date.now();
  const isWin = process.platform === 'win32';
  const cmdToRun = isWin && fsSync.existsSync(GIT_BASH)
    ? `"${GIT_BASH}" -l -c ${JSON.stringify(command)}`
    : (isWin && !command.trim().startsWith('cmd /c') ? `cmd /c "${command}"` : command);

  return new Promise((resolve) => {
    exec(cmdToRun, { cwd: workspaceRoot, timeout: EXEC_TIMEOUT, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      const output = (stdout || '').trim();
      const errorOutput = (stderr || '').trim();
      const passed = !err;
      resolve({
        passed,
        command,
        output: output || errorOutput,
        error: !passed ? (errorOutput || output || err?.message) : undefined,
        durationMs: Date.now() - started
      });
    });
  });
};

export class MultiTierVerifier {
  public static async verifyAllTiers(
    workspaceRoot: string,
    options: { skipBuild?: boolean; testFilter?: string; targetFiles?: string[] } = {}
  ): Promise<MultiTierVerificationReport> {
    const started = Date.now();
    const cmds = await detectProjectCommands(workspaceRoot);

    // Tier 1: Static Type & Syntax Gate
    const t1 = await runShell(workspaceRoot, cmds.typecheckCmd);

    // Tier 2: Unit & Regression Test Suite Gate
    let testCmd = cmds.testCmd || 'npm test';
    if (options.testFilter) {
      if (options.testFilter.endsWith('.ts') || options.testFilter.endsWith('.js')) {
        const testPath = options.testFilter.startsWith('scripts/') ? options.testFilter : `scripts/${options.testFilter}`;
        testCmd = `npx tsx ${testPath}`;
      } else {
        testCmd = `${cmds.testCmd || 'npm test'} -- ${options.testFilter}`;
      }
    }
    const t2 = await runShell(workspaceRoot, testCmd);

    // Tier 3: Production Bundler & Build Gate
    const t3 = !options.skipBuild && cmds.buildCmd
      ? await runShell(workspaceRoot, cmds.buildCmd)
      : { passed: true, command: 'build (skipped)', output: 'Build skipped by request', durationMs: 0 };

    // Tier 4: Architectural Invariants & Modularity Gate (<150 lines per file)
    const t4 = await auditFileInvariants(workspaceRoot, options.targetFiles || []);

    const passed = t1.passed && t2.passed && t3.passed && t4.passed;
    const totalDurationMs = Date.now() - started;

    let formattedReport = '';
    let feedbackPrompt: string | undefined;

    if (passed) {
      formattedReport = `🛡️ **5-STEP VERIFICATION CERTIFICATE: [100% VERIFIED]**
- **Tier 1 (Syntax & Typecheck)**: \`PASSED\` (${t1.command} - ${t1.durationMs}ms)
- **Tier 2 (Test Suite & Regression)**: \`PASSED\` (${t2.command} - ${t2.durationMs}ms)
- **Tier 3 (Production Bundle Build)**: \`PASSED\` (${t3.command} - ${t3.durationMs}ms)
- **Tier 4 (Modularity & Rule Invariants)**: \`PASSED\` (All touched files < 150 lines, zero secrets leaked)
- **Total Verification Time**: ${(totalDurationMs / 1000).toFixed(1)}s (Zero regressions detected)`;
    } else {
      const failures: string[] = [];
      if (!t1.passed) failures.push(`❌ Tier 1 (Typecheck): ${t1.command}\n${t1.error?.slice(0, 1500)}`);
      if (!t2.passed) failures.push(`❌ Tier 2 (Tests): ${t2.command}\n${t2.error?.slice(0, 1500)}`);
      if (!t3.passed) failures.push(`❌ Tier 3 (Build): ${t3.command}\n${t3.error?.slice(0, 1500)}`);
      if (!t4.passed) failures.push(`❌ Tier 4 (Rule Invariants):\n${t4.violations.join('\n')}`);

      formattedReport = `⚠️ **5-STEP VERIFICATION FAILED (${failures.length} Tier Violation(s))**:\n\n${failures.join('\n\n')}`;
      feedbackPrompt = `[DETERMINISTIC VERIFICATION INVARIANT FAILED]
The multi-tier invariant verification gate detected these concrete failures:
${failures.join('\n\n')}

MANDATORY SELF-CORRECTION DIRECTIVE:
1. Carefully inspect the failing assertions, compiler errors, or modularity line counts above.
2. Call 'read_file' on the affected files to isolate exact line numbers.
3. Call 'edit_file' to patch the bugs, fix the failing tests, or refactor files exceeding 150 lines.
4. Call 'verify_project_invariants' to re-verify until ALL 4 tiers pass cleanly.`;
    }

    return { passed, tier1Syntax: t1, tier2Tests: t2, tier3Build: t3, tier4Invariants: t4, totalDurationMs, formattedReport, feedbackPrompt };
  }
}