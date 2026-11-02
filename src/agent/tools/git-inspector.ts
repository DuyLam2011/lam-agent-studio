import { CommandRunner } from './command-runner';
import { GitStatusSummary, ToolResult } from '../types';

export class GitInspector {
  private commandRunner: CommandRunner;

  constructor(workspaceRoot: string) {
    this.commandRunner = new CommandRunner(workspaceRoot);
  }

  public async inspect(): Promise<ToolResult<GitStatusSummary>> {
    const startTime = Date.now();
    try {
      const statusRes = await this.commandRunner.run('git status --porcelain', 15000);
      if (statusRes.exitCode !== 0) {
        return {
          success: true,
          output: '[GIT STATUS] Not a Git repository or Git is not initialized in this workspace.',
          executionTimeMs: Date.now() - startTime,
          metadata: {
            hasChanges: false,
            staged: [],
            modified: [],
            untracked: [],
            diffStat: '',
            rawStatus: ''
          }
        };
      }

      const diffStatRes = await this.commandRunner.run('git diff --stat', 15000);
      const rawStatus = statusRes.stdout;
      const lines = rawStatus ? rawStatus.split('\n').filter(Boolean) : [];

      const staged: string[] = [];
      const modified: string[] = [];
      const untracked: string[] = [];

      for (const line of lines) {
        const x = line[0];
        const y = line[1];
        const file = line.substring(3).trim();

        if (x !== ' ' && x !== '?' && x !== '!') staged.push(file);
        if (y === 'M' || y === 'D') modified.push(file);
        if (x === '?' && y === '?') untracked.push(file);
      }

      const diffStat = diffStatRes.stdout || 'No unstaged file modifications.';
      const hasChanges = lines.length > 0;

      const summaryText = [
        '### Git Working Tree Status',
        `- Has Changes: ${hasChanges ? 'Yes' : 'Clean (No pending changes)'}`,
        `- Staged (${staged.length}): ${staged.length > 0 ? staged.join(', ') : 'none'}`,
        `- Modified (${modified.length}): ${modified.length > 0 ? modified.join(', ') : 'none'}`,
        `- Untracked (${untracked.length}): ${untracked.length > 0 ? untracked.slice(0, 10).join(', ') : 'none'}`,
        '',
        '#### Diff Stat Summary:',
        diffStat
      ].join('\n');

      return {
        success: true,
        output: summaryText,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          hasChanges,
          staged,
          modified,
          untracked,
          diffStat,
          rawStatus
        }
      };
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: `Git inspection failed: ${err.message}`,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
