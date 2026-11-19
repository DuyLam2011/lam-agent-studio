import { simpleGit, SimpleGit } from 'simple-git';

export interface ComprehensiveGitReviewResult {
  success: boolean;
  summary: string;
  currentBranch: string;
  filesChanged: number;
  stagedCount: number;
  untrackedCount: number;
  diffText: string;
  error?: string;
}

export class GitReviewContextService {
  public static async getComprehensiveContext(
    repoPath: string,
    targetRef?: string
  ): Promise<ComprehensiveGitReviewResult> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return {
          success: false,
          summary: 'Directory is not a git repository',
          currentBranch: '',
          filesChanged: 0,
          stagedCount: 0,
          untrackedCount: 0,
          diffText: '',
          error: 'Not a git repository'
        };
      }

      // Execute status and diffs concurrently in Electron Main process
      const [status, unstagedDiff, stagedDiff] = await Promise.all([
        git.status(),
        git.diff().catch(() => ''),
        git.diff(['--staged']).catch(() => '')
      ]);

      const currentBranch = status.current || 'main';
      const filesChanged = status.files?.length || 0;
      const stagedCount = status.staged?.length || 0;
      const untrackedCount = status.not_added?.length || 0;

      const sections: string[] = [];
      sections.push(
        `### 📊 Git Status Summary:\n- Active branch: \`${currentBranch}\`\n- Modified files: ${filesChanged} (${stagedCount} staged, ${untrackedCount} untracked)`
      );

      // Branch diff if comparing against target (e.g. origin/main)
      if (targetRef && targetRef.trim()) {
        const cleanRef = targetRef.trim();
        try {
          const branchDiff = await git.diff([`${cleanRef}...HEAD`]).catch(async () => {
            return await git.diff([cleanRef]);
          });
          if (branchDiff && branchDiff.trim()) {
            sections.push(`### 🌿 Branch Diff against \`${cleanRef}\`:\n\`\`\`diff\n${branchDiff.slice(0, 10000)}\n\`\`\``);
          }
        } catch {
          // branch diff unavailable
        }
      }

      if (unstagedDiff && unstagedDiff.trim()) {
        sections.push(`### 📝 Unstaged Working Tree Diff:\n\`\`\`diff\n${unstagedDiff.slice(0, 6000)}\n\`\`\``);
      }

      if (stagedDiff && stagedDiff.trim()) {
        sections.push(`### 📦 Staged Changes Diff:\n\`\`\`diff\n${stagedDiff.slice(0, 6000)}\n\`\`\``);
      }

      const summary = `${filesChanged} files modified (${stagedCount} staged, ${untrackedCount} untracked, branch \`${currentBranch}\`)`;

      return {
        success: true,
        summary,
        currentBranch,
        filesChanged,
        stagedCount,
        untrackedCount,
        diffText: sections.join('\n\n')
      };
    } catch (err: any) {
      return {
        success: false,
        summary: 'Error inspecting local git status',
        currentBranch: '',
        filesChanged: 0,
        stagedCount: 0,
        untrackedCount: 0,
        diffText: '',
        error: err?.message || 'Failed to inspect git context'
      };
    }
  }
}
