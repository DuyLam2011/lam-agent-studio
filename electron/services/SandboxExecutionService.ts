import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { SandboxSecurityConfig } from '../../src/types/settings-center';

const GIT_BASH = 'C:\\Program Files\\Git\\bin\\bash.exe';
const SENSITIVE_ENV_KEYS = [/KEY/i, /SECRET/i, /TOKEN/i, /PASSWORD/i, /AUTH/i, /CREDENTIAL/i];

export class SandboxExecutionService {
  public static getSandboxDir(workspaceRoot: string): string {
    return path.join(workspaceRoot, '.agents', 'sandbox');
  }

  public static async ensureSandbox(workspaceRoot: string): Promise<string> {
    const sandboxDir = this.getSandboxDir(workspaceRoot);
    if (!fsSync.existsSync(sandboxDir)) {
      await fs.mkdir(sandboxDir, { recursive: true });
      await fs.writeFile(path.join(sandboxDir, '.gitignore'), '*\n!.gitignore\n');
    }
    return sandboxDir;
  }

  public static validateOutboundLink(urlStr: string, config: SandboxSecurityConfig): { allowed: boolean; reason?: string } {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      if (config.blockOutboundLinks && !isLocal) {
        return { allowed: false, reason: `[SANDBOX BLOCKED] Outbound URL '${urlStr}' blocked by security policy.` };
      }
      if (config.allowedOutboundDomains?.length > 0 && !isLocal) {
        const matches = config.allowedOutboundDomains.some(d => {
          const clean = d.toLowerCase().replace(/:\*$/, '').replace(/\*$/, '');
          return host === clean || host.endsWith('.' + clean) || d === '*';
        });
        if (!matches) {
          return { allowed: false, reason: `[SANDBOX BLOCKED] Domain '${host}' is not in allowed outbound domains list.` };
        }
      }
      return { allowed: true };
    } catch {
      return { allowed: false, reason: `[SANDBOX BLOCKED] Invalid URL format: '${urlStr}'` };
    }
  }

  public static async runScriptInSandbox(
    script: string,
    language: 'javascript' | 'bash',
    workspaceRoot: string,
    config: SandboxSecurityConfig
  ): Promise<{ success: boolean; output: string; exitCode: number; executionTimeMs: number; securityNotice?: string }> {
    const start = Date.now();
    const sandboxDir = await this.ensureSandbox(workspaceRoot);
    const id = Date.now();
    const ext = language === 'javascript' ? 'js' : 'sh';
    const filePath = path.join(sandboxDir, `test_run_${id}.${ext}`);
    await fs.writeFile(filePath, script, 'utf-8');

    // Build sanitized environment without sensitive secrets
    const sanitizedEnv: NodeJS.ProcessEnv = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (config.stripSensitiveEnvInSandbox && SENSITIVE_ENV_KEYS.some(regex => regex.test(k))) continue;
      sanitizedEnv[k] = v;
    }

    const command = language === 'javascript'
      ? `node "${filePath}"`
      : (fsSync.existsSync(GIT_BASH) ? `"${GIT_BASH}" -l -c "bash '${filePath.replace(/\\/g, '/')}'"` : `bash "${filePath}"`);

    const timeout = config.sandboxTimeoutMs || 15000;

    return new Promise((resolve) => {
      exec(command, { cwd: sandboxDir, env: sanitizedEnv, timeout, maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
        const elapsed = Date.now() - start;
        try { await fs.unlink(filePath); } catch {}
        if (err && (err as any).killed) {
          return resolve({ success: false, output: `[SANDBOX TIMEOUT] Execution exceeded ${timeout}ms limit.`, exitCode: 124, executionTimeMs: elapsed, securityNotice: 'Killed by sandbox watchdog.' });
        }
        const output = (stdout + (stderr ? `\n[STDERR]\n${stderr}` : '')).trim();
        const code = err ? (err.code ?? 1) : 0;
        resolve({
          success: !err,
          output: output || (err ? err.message : '(Execution produced no output)'),
          exitCode: code,
          executionTimeMs: elapsed,
          securityNotice: config.stripSensitiveEnvInSandbox ? 'Sanitized environment (Secrets stripped)' : undefined
        });
      });
    });
  }

  public static async clearSandbox(workspaceRoot: string): Promise<boolean> {
    const sandboxDir = this.getSandboxDir(workspaceRoot);
    if (!fsSync.existsSync(sandboxDir)) return true;
    try {
      const files = await fs.readdir(sandboxDir);
      for (const f of files) {
        if (f !== '.gitignore') await fs.rm(path.join(sandboxDir, f), { recursive: true, force: true });
      }
      return true;
    } catch {
      return false;
    }
  }
}
