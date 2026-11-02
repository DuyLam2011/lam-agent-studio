import { CommandRunner } from '../tools/CommandRunner';
import { VerificationResult, VerificationConfig } from '../types/verifier';

export class CompilerVerifier {
  private commandRunner: CommandRunner;
  private defaultCommand: string;

  constructor(workspaceRoot: string, config: VerificationConfig = {}) {
    this.commandRunner = new CommandRunner(workspaceRoot);
    this.defaultCommand = config.command || 'npx tsc --noEmit';
  }

  public async verify(customCommand?: string): Promise<VerificationResult> {
    const cmd = customCommand || this.defaultCommand;
    const res = await this.commandRunner.run(cmd, 60000);

    const passed = res.exitCode === 0;

    return {
      passed,
      command: cmd,
      exitCode: res.exitCode,
      stdout: res.stdout,
      stderr: res.stderr,
      durationMs: res.executionTimeMs
    };
  }

  public formatFeedbackPrompt(result: VerificationResult): string {
    const errorDetails = result.stderr || result.stdout || 'Unknown compiler error';
    return `[COMPILER VERIFICATION FAILED (Exit Code ${result.exitCode})]
Command run: '${result.command}'
Compiler Diagnostics & Error Output:
\`\`\`
${errorDetails.slice(0, 4000)}
\`\`\`

INSTRUCTION TO FIX:
1. Carefully inspect the compiler error above (notice file names, line numbers, and type mismatches).
2. Call read_file on the affected file to check the exact lines.
3. Call patch_file to fix the syntax or type errors.
Do not stop until the compiler passes with Exit Code 0.`;
  }
}
