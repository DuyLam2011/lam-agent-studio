import { exec } from 'child_process';
import fsSync from 'fs';
import { CommandRunResult } from '../types/tools';

export class CommandRunner {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  public async run(command: string, timeoutMs: number = 30000): Promise<CommandRunResult> {
    const startTime = Date.now();
    const bashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
    
    // Choose shell standard based on platform
    let cmdToRun = command;
    if (process.platform === 'win32') {
      if (fsSync.existsSync(bashPath)) {
        cmdToRun = `"${bashPath}" -l -c ${JSON.stringify(command)}`;
      } else if (!command.trim().startsWith('cmd /c')) {
        cmdToRun = `cmd /c "${command}"`;
      }
    }

    return new Promise<CommandRunResult>((resolve) => {
      exec(
        cmdToRun,
        {
          cwd: this.workspaceRoot,
          timeout: timeoutMs,
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, CI: 'true', FORCE_COLOR: '0' }
        },
        (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
          
          resolve({
            stdout: (stdout || '').trim(),
            stderr: (stderr || (error && exitCode !== 0 ? error.message : '')).trim(),
            exitCode,
            executionTimeMs: duration
          });
        }
      );
    });
  }
}
