import { WebContents } from 'electron';
import { spawn as cpSpawn, ChildProcess } from 'child_process';
import fs from 'fs';

interface TerminalSession {
  ptyProcess?: any;
  childProcess?: ChildProcess;
  buffer: string[];
}

export class TerminalService {
  private sessions = new Map<string, TerminalSession>();
  private webContents: WebContents | null = null;

  setWebContents(contents: WebContents | null) {
    this.webContents = contents;
  }

  private resolveShell(customShell?: string): { shell: string; args: string[] } {
    if (customShell && fs.existsSync(customShell)) {
      return { shell: customShell, args: [] };
    }
    if (process.platform === 'win32') {
      const sysRoot = process.env.SystemRoot || 'C:\\Windows';
      const ps = `${sysRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
      return { shell: process.env.COMSPEC || (fs.existsSync(ps) ? ps : 'powershell.exe'), args: [] };
    }
    return { shell: process.env.SHELL || '/bin/bash', args: ['-l'] };
  }

  getAvailableShells(): { name: string; path: string }[] {
    const list: { name: string; path: string }[] = [];
    if (process.platform === 'win32') {
      const sysRoot = process.env.SystemRoot || 'C:\\Windows';
      const ps = `${sysRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
      const cmd = process.env.COMSPEC || `${sysRoot}\\System32\\cmd.exe`;
      if (fs.existsSync(ps)) list.push({ name: 'PowerShell', path: ps });
      if (fs.existsSync(cmd)) list.push({ name: 'Command Prompt', path: cmd });
      const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
      if (fs.existsSync(gitBash)) list.push({ name: 'Git Bash', path: gitBash });
    } else {
      const def = process.env.SHELL || '/bin/bash';
      list.push({ name: 'Default Shell', path: def });
      ['/bin/zsh', '/bin/bash'].forEach(sh => {
        if (fs.existsSync(sh) && sh !== def) list.push({ name: sh.split('/').pop() || sh, path: sh });
      });
    }
    return list;
  }

  spawn(id: string, cwd?: string, cols = 80, rows = 24, customShell?: string): boolean {
    this.kill(id);
    const { shell, args } = this.resolveShell(customShell);
    const workingDir = cwd || process.cwd();
    const session: TerminalSession = { buffer: [] };

    let ptyModule: any = null;
    try { ptyModule = require('node-pty'); } catch { ptyModule = null; }

    if (ptyModule) {
      try {
        const ptyProc = ptyModule.spawn(shell, args, {
          name: 'xterm-color',
          cols,
          rows,
          cwd: workingDir,
          env: process.env as Record<string, string>
        });
        ptyProc.onData((data: string) => this.recordData(id, data));
        ptyProc.onExit(({ exitCode }: { exitCode: number }) => this.notifyExit(id, exitCode));
        session.ptyProcess = ptyProc;
        this.sessions.set(id, session);
        return true;
      } catch (err) {
        console.warn('node-pty spawn failed, falling back:', err);
      }
    }

    const cp = cpSpawn(shell, args, { cwd: workingDir, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
    cp.stdout?.on('data', (chunk) => this.recordData(id, chunk.toString()));
    cp.stderr?.on('data', (chunk) => this.recordData(id, chunk.toString()));
    cp.on('exit', (code) => this.notifyExit(id, code || 0));

    session.childProcess = cp;
    this.sessions.set(id, session);
    return true;
  }

  write(id: string, data: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    if (session.ptyProcess) session.ptyProcess.write(data);
    else if (session.childProcess?.stdin) session.childProcess.stdin.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    const session = this.sessions.get(id);
    if (session?.ptyProcess?.resize) {
      try { session.ptyProcess.resize(cols, rows); } catch {}
    }
  }

  kill(id: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    if (session.ptyProcess) try { session.ptyProcess.kill(); } catch {}
    if (session.childProcess) try { session.childProcess.kill(); } catch {}
    this.sessions.delete(id);
  }

  getBuffer(id: string): string {
    return this.sessions.get(id)?.buffer.slice(-100).join('') || '';
  }

  private recordData(id: string, data: string) {
    const session = this.sessions.get(id);
    if (session) {
      session.buffer.push(data);
      if (session.buffer.length > 500) session.buffer.shift();
    }
    if (this.webContents && !this.webContents.isDestroyed()) {
      this.webContents.send('terminal:data', { id, data });
    }
  }

  private notifyExit(id: string, code: number) {
    if (this.webContents && !this.webContents.isDestroyed()) {
      this.webContents.send('terminal:exit', { id, code });
    }
  }

  killAll() {
    for (const [id] of this.sessions) this.kill(id);
  }
}

export const terminalService = new TerminalService();
