import os from 'os';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { settingsManager } from './SettingsManager';
import { modelDiscoveryService } from './ModelDiscoveryService';

const execFileAsync = promisify(execFile);

export interface GoogleAccountStatus {
  connected: boolean;
  engine: 'antigravity';
  email: string;
  name: string;
  models: Array<{ id: string; name: string }>;
  binaryPath: string;
  lastChecked: number;
  authMethod: 'antigravity_cli' | 'none';
  error?: string;
}

export class GoogleAccountService {
  private isConnected = false;
  private currentEmail = '';
  private currentName = 'Guest';
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.restoreSavedSession();
  }

  private async restoreSavedSession() {
    try {
      const s = await settingsManager.loadSettings();
      if (s.googleConnected && s.googleEmail) {
        this.isConnected = true;
        this.currentEmail = s.googleEmail;
        this.currentName = s.googleName || s.googleEmail.split('@')[0] || 'Google User';
      }
    } catch {}
  }

  public getBinaryPath(): string {
    const exe = process.platform === 'win32' ? 'agy.exe' : 'agy';
    const candidates = [
      path.join(os.homedir(), '.gemini', 'bin', exe),
      'D:\\Antigravity IDE\\bin\\antigravity-ide.cmd',
      path.join(os.homedir(), '.gemini', 'antigravity-cli', 'bin', exe),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity IDE', 'bin', 'antigravity-ide.cmd')
    ];
    return candidates.find((c) => fs.existsSync(c)) || exe;
  }

  public async getStatus(): Promise<GoogleAccountStatus> {
    await this.initPromise;
    const binPath = this.getBinaryPath();
    const exists = fs.existsSync(binPath) || binPath === 'agy' || binPath === 'agy.exe';
    let models = modelDiscoveryService.getModelsForAccountStatus('antigravity');

    if (exists) {
      try {
        const { stdout } = await execFileAsync(binPath, ['models'], { timeout: 6000 });
        const parsed = stdout
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.toLowerCase().includes('fetching'))
          .map((l) => {
            const [id, ...rest] = l.split(/\t+|\s{2,}/);
            return { id: id.trim(), name: rest.join(' ').trim() || id.trim() };
          })
          .filter((m) => m.id.length > 0);
        for (const pm of parsed) {
          if (!models.some((m) => m.id === pm.id)) models.push(pm);
        }
      } catch {}
    }

    return {
      connected: this.isConnected && exists,
      engine: 'antigravity',
      email: this.isConnected ? this.currentEmail : 'Not signed in',
      name: this.isConnected ? this.currentName : 'Guest',
      models,
      binaryPath: binPath,
      authMethod: this.isConnected ? 'antigravity_cli' : 'none',
      lastChecked: Date.now()
    };
  }

  public async login(customEmail?: string): Promise<{ success: boolean; status: GoogleAccountStatus; error?: string }> {
    await this.initPromise;
    const binPath = this.getBinaryPath();
    const targetEmail = (customEmail && customEmail.trim()) || this.currentEmail || 'lavender.mqeen@gmail.com';
    const targetName = targetEmail.split('@')[0] || 'Google User';

    try {
      await execFileAsync(binPath, ['models'], { timeout: 8000 });
      this.isConnected = true;
      this.currentEmail = targetEmail;
      this.currentName = targetName;
      await settingsManager.saveSettings({
        googleConnected: true,
        googleEmail: targetEmail,
        googleName: targetName,
        aiProvider: 'antigravity'
      });
      const status = await this.getStatus();
      return { success: true, status };
    } catch (err: any) {
      this.isConnected = false;
      const status = await this.getStatus();
      return {
        success: false,
        status,
        error: `Antigravity CLI engine check failed at ${binPath}: ${err?.message || 'timeout'}`
      };
    }
  }

  public async disconnect(): Promise<{ success: boolean }> {
    await this.initPromise;
    this.isConnected = false;
    this.currentEmail = '';
    this.currentName = 'Guest';
    await settingsManager.saveSettings({
      googleConnected: false,
      googleEmail: '',
      googleName: '',
      aiProvider: 'gemini'
    });
    return { success: true };
  }
}

export const googleAccountService = new GoogleAccountService();
