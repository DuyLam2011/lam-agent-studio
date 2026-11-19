import fs from 'fs';
import { exec } from 'child_process';
import { terminalService } from './TerminalService';
import { AgentExecutionEnvironment, EnvironmentInfo, AgentTerminalRunRecord } from '../../src/types/execution-environment';

const GIT_BASH = 'C:\\Program Files\\Git\\bin\\bash.exe';
const POWERSHELL = `${process.env.SystemRoot || 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;

export class ExecutionEnvironmentService {
  private static recentRuns: AgentTerminalRunRecord[] = [];
  private static detectedWsl = false;
  private static detectedDistros: string[] = [];
  private static hasDocker = false;
  private static lastCheck = 0;

  public static async refreshDetection(): Promise<void> {
    if (Date.now() - this.lastCheck < 10000 && this.detectedDistros.length > 0) return;
    this.lastCheck = Date.now();
    if (process.platform !== 'win32') return;

    try {
      await new Promise<void>((resolve) => {
        exec('wsl.exe -l -q', { timeout: 3000 }, (err, stdout) => {
          if (!err && stdout) {
            this.detectedWsl = true;
            this.detectedDistros = stdout.split(/\r?\n/).map(s => s.replace(/\0/g, '').trim()).filter(Boolean);
          } else {
            this.detectedWsl = false;
            this.detectedDistros = [];
          }
          resolve();
        });
      });
    } catch {
      this.detectedWsl = false;
    }

    try {
      await new Promise<void>((resolve) => {
        const cmd = this.detectedWsl ? 'wsl.exe docker --version' : 'docker --version';
        exec(cmd, { timeout: 3000 }, (err, stdout) => {
          this.hasDocker = !err && /docker/i.test(stdout);
          resolve();
        });
      });
    } catch {
      this.hasDocker = false;
    }
  }

  public static async getAvailableEnvironments(): Promise<EnvironmentInfo[]> {
    await this.refreshDetection();
    const hasGitBash = fs.existsSync(GIT_BASH);
    const hasPs = fs.existsSync(POWERSHELL);
    const primaryWsl = this.detectedDistros[0] || 'Ubuntu';

    return [
      { id: 'gitbash', name: 'Git Bash', detected: hasGitBash, path: GIT_BASH, badge: 'MSYS2', description: 'Unix toolchains & Node runtime (Default)' },
      { id: 'wsl', name: `WSL (${primaryWsl})`, detected: this.detectedWsl, path: 'wsl.exe', badge: 'Linux Kernel', versionInfo: this.detectedDistros.join(', '), description: 'Full native Linux subsystem execution' },
      { id: 'powershell', name: 'PowerShell', detected: hasPs, path: POWERSHELL, badge: 'Windows', description: 'Windows native automation & cmdlets' },
      { id: 'docker', name: 'Docker Sandbox', detected: this.hasDocker, path: 'docker', badge: 'Container', description: 'Isolated ephemeral container sandbox' }
    ];
  }

  public static buildShellCommand(cmd: string, env: AgentExecutionEnvironment, cwd: string, distro = 'Ubuntu', image = 'node:20-alpine'): string {
    const isWin = process.platform === 'win32';
    if (!isWin) return cmd;

    if (env === 'wsl') {
      const escaped = cmd.replace(/"/g, '\\"');
      return `wsl.exe -d ${distro} --cd "${cwd}" -- bash -c "${escaped}"`;
    }
    if (env === 'docker') {
      const escaped = cmd.replace(/"/g, '\\"');
      const prefix = this.detectedWsl ? 'wsl.exe docker' : 'docker';
      return `${prefix} run --rm -v "${cwd}:/workspace" -w /workspace ${image} sh -c "${escaped}"`;
    }
    if (env === 'powershell') {
      return `powershell.exe -NoProfile -NonInteractive -Command "${cmd.replace(/"/g, '`"')}"`;
    }
    if (fs.existsSync(GIT_BASH)) {
      return `"${GIT_BASH}" -l -c ${JSON.stringify(cmd)}`;
    }
    return `cmd /c "${cmd}"`;
  }

  public static async executeAgentCommand(params: {
    command: string;
    environment?: AgentExecutionEnvironment;
    workspaceRoot: string;
    wslDistro?: string;
    dockerImage?: string;
    streamToTerminal?: boolean;
    terminalId?: string;
    agentName?: string;
  }): Promise<{ exitCode: number; stdout: string; stderr: string; durationMs: number; environment: AgentExecutionEnvironment }> {
    const { command, workspaceRoot, wslDistro = 'Ubuntu', dockerImage = 'node:20-alpine', streamToTerminal = true, terminalId = 'term-main', agentName = 'Agent' } = params;
    const env = params.environment || 'gitbash';
    const finalCmd = this.buildShellCommand(command, env, workspaceRoot, wslDistro, dockerImage);
    const start = Date.now();

    if (streamToTerminal) {
      terminalService.write(terminalId, `\r\n\x1b[36m[AGENT: ${agentName.toUpperCase()}]\x1b[0m \x1b[35m[${env.toUpperCase()}]\x1b[0m \x1b[33m$ ${command}\x1b[0m\r\n`);
    }

    return new Promise((resolve) => {
      exec(finalCmd, { cwd: workspaceRoot, timeout: 45000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        const durationMs = Date.now() - start;
        const exitCode = error ? (error.code ?? 1) : 0;
        const outStr = (stdout || '').trim();
        const errStr = (stderr || (error ? error.message : '')).trim();

        if (streamToTerminal) {
          if (outStr) terminalService.write(terminalId, `${outStr.replace(/\n/g, '\r\n')}\r\n`);
          if (errStr) terminalService.write(terminalId, `\x1b[31m${errStr.replace(/\n/g, '\r\n')}\x1b[0m\r\n`);
          terminalService.write(terminalId, `\x1b[90m[EXIT ${exitCode}] (${durationMs}ms)\x1b[0m\r\n`);
        }

        const runRecord: AgentTerminalRunRecord = {
          id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          command, environment: env, status: exitCode === 0 ? 'success' : 'failed',
          exitCode, stdout: outStr, stderr: errStr, durationMs, timestamp: Date.now(), agentName
        };
        ExecutionEnvironmentService.recentRuns.unshift(runRecord);
        if (ExecutionEnvironmentService.recentRuns.length > 50) ExecutionEnvironmentService.recentRuns.pop();

        resolve({ exitCode, stdout: outStr, stderr: errStr, durationMs, environment: env });
      });
    });
  }

  public static getRecentRuns(): AgentTerminalRunRecord[] {
    return this.recentRuns;
  }
}
