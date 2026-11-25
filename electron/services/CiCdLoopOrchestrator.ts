import { CiCdVerificationService, CiCdVerificationReport } from './CiCdVerificationService';

export interface CiCdLoopOptions {
  maxAttempts?: number;
  githubToken?: string;
  skipBuild?: boolean;
  testFilter?: string;
  repairFn?: (report: CiCdVerificationReport, attempt: number) => Promise<boolean>;
}

export interface CiCdLoopIteration {
  attempt: number;
  passed: boolean;
  score: number;
  errorsCount: number;
  actionTaken?: string;
}

export interface CiCdLoopResult {
  success: boolean;
  status: 'resolved' | 'max_attempts_exceeded' | 'repaired';
  attemptsRun: number;
  initialErrorsCount: number;
  remainingErrorsCount: number;
  timeline: CiCdLoopIteration[];
  finalReport: CiCdVerificationReport;
  formattedSummary: string;
}

export class CiCdLoopOrchestrator {
  public static async executeSelfHealingLoop(
    workspaceRoot: string,
    options: CiCdLoopOptions = {}
  ): Promise<CiCdLoopResult> {
    const maxAttempts = Math.min(Math.max(options.maxAttempts || 3, 1), 5);
    const timeline: CiCdLoopIteration[] = [];
    let initialErrorsCount = 0;
    let finalReport!: CiCdVerificationReport;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      finalReport = await CiCdVerificationService.runFullAudit(workspaceRoot, {
        githubToken: options.githubToken,
        skipBuild: options.skipBuild,
        testFilter: options.testFilter
      });

      if (attempt === 1) {
        initialErrorsCount = finalReport.compositeErrors.length;
      }

      const errorsCount = finalReport.compositeErrors.length;
      let actionTaken = 'Evaluated CI/CD, lint & invariants';

      if (finalReport.passed) {
        timeline.push({ attempt, passed: true, score: finalReport.score, errorsCount: 0, actionTaken: 'All checks passed cleanly' });
        return this.formatResult(true, attempt === 1 ? 'resolved' : 'repaired', attempt, initialErrorsCount, 0, timeline, finalReport);
      }

      if (options.repairFn && attempt < maxAttempts) {
        const repaired = await options.repairFn(finalReport, attempt);
        actionTaken = repaired ? `Applied surgical patches for ${errorsCount} issue(s)` : 'Repair action skipped';
      }

      timeline.push({ attempt, passed: false, score: finalReport.score, errorsCount, actionTaken });
      if (!options.repairFn) break;
    }

    const remaining = finalReport.compositeErrors.length;
    return this.formatResult(false, 'max_attempts_exceeded', timeline.length, initialErrorsCount, remaining, timeline, finalReport);
  }

  private static formatResult(
    success: boolean,
    status: 'resolved' | 'max_attempts_exceeded' | 'repaired',
    attemptsRun: number,
    initial: number,
    remaining: number,
    timeline: CiCdLoopIteration[],
    report: CiCdVerificationReport
  ): CiCdLoopResult {
    const timelineStr = timeline.map(t => `  - Iteration ${t.attempt}: Score ${t.score}/100 | Errors: ${t.errorsCount} | ${t.actionTaken}`).join('\n');
    const formattedSummary = [
      `🔄 **CI/CD AUTONOMOUS AGENT SELF-HEALING LOOP: [${success ? 'RESOLVED' : 'ATTENTION REQUIRED'}]**`,
      `- **Status**: \`${status.toUpperCase()}\` | **Attempts**: ${attemptsRun}`,
      `- **Initial Errors**: ${initial} ➔ **Remaining**: ${remaining}`,
      `\n### ⏱️ Loop Execution Timeline:`,
      timelineStr,
      `\n---\n${report.formattedReport}`
    ].join('\n');

    return {
      success,
      status,
      attemptsRun,
      initialErrorsCount: initial,
      remainingErrorsCount: remaining,
      timeline,
      finalReport: report,
      formattedSummary
    };
  }
}
