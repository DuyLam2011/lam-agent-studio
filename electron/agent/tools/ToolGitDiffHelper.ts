import { simpleGit } from 'simple-git';

export class ToolGitDiffHelper {
  public static async diff(workspaceRoot: string, args: any): Promise<string> {
    const git = simpleGit(workspaceRoot);
    const diffArgs: string[] = [];
    if (args?.staged) diffArgs.push('--staged');
    if (args?.path) diffArgs.push('--', args.path);
    let diffOutput = '';
    try {
      diffOutput = await git.diff(diffArgs);
      if (!diffOutput && !args?.staged && !args?.path) diffOutput = await git.diff(['HEAD~1']);
    } catch (err: any) {
      diffOutput = `Git diff notice: ${err.message}`;
    }
    return diffOutput || '(No git diff changes detected in working tree or HEAD~1)';
  }
}
