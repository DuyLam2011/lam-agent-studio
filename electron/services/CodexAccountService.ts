import os from 'os'; import path from 'path'; import fs from 'fs';
import { spawn } from 'child_process';
import { shell } from 'electron';
import { settingsManager } from './SettingsManager';
import { modelDiscoveryService } from './ModelDiscoveryService';

export interface CodexAccountStatus {
  connected: boolean; engine: 'codex'; authMode: 'chatgpt' | 'api_key' | 'none';
  email?: string; name?: string; planType?: string;
  models: Array<{ id: string; name: string; description?: string }>;
  binaryPath: string; lastChecked: number; error?: string;
}

export class CodexAccountService {
  private isConnectedManually = false;
  private initPromise: Promise<void>;

  constructor() { this.initPromise = this.restoreSavedSession(); }

  private async restoreSavedSession() {
    try {
      const s = await settingsManager.loadSettings();
      const authPath = path.join(os.homedir(), '.codex', 'auth.json');
      if (s.codexConnected && fs.existsSync(authPath)) this.isConnectedManually = true;
    } catch {}
  }

  public getBinaryPath(): string {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const codexBinRoot = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
    if (fs.existsSync(codexBinRoot)) {
      try {
        for (const sub of fs.readdirSync(codexBinRoot)) {
          const candidate = path.join(codexBinRoot, sub, process.platform === 'win32' ? 'codex.exe' : 'codex');
          if (fs.existsSync(candidate)) return candidate;
        }
      } catch {}
    }
    return process.platform === 'win32' ? 'codex.exe' : 'codex';
  }

  public async getStatus(): Promise<CodexAccountStatus> {
    await this.initPromise;
    const binPath = this.getBinaryPath();
    const home = os.homedir();
    const authPath = path.join(home, '.codex', 'auth.json');
    let email = 'chatgpt-user@openai.com', name = 'ChatGPT Subscriber', planType = 'ChatGPT Plan';
    let authMode: 'chatgpt' | 'api_key' | 'none' = 'none', hasValidAuth = false;

    if (fs.existsSync(authPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
        if (parsed.auth_mode === 'chatgpt' || parsed.tokens?.access_token) {
          authMode = 'chatgpt'; hasValidAuth = true;
          const jwtProfile = parsed.tokens?.access_token?.split('.')?.[1];
          if (jwtProfile) {
            const decoded = JSON.parse(Buffer.from(jwtProfile, 'base64').toString('utf-8'));
            email = decoded['https://api.openai.com/profile']?.email || decoded.email || email;
            name = decoded['https://api.openai.com/profile']?.name || decoded.name || name;
            planType = decoded['https://api.openai.com/auth']?.chatgpt_plan_type || 'team';
          }
        }
      } catch {}
    } else if (this.isConnectedManually && !process.versions.electron) {
      authMode = 'chatgpt'; hasValidAuth = true; planType = 'TEAM';
    }

    const discovered = modelDiscoveryService.getDiscoveredModels('codex');
    const models = discovered.models.map((m) => ({ id: m.id, name: m.name, description: m.description }));

    return {
      connected: this.isConnectedManually && hasValidAuth,
      engine: 'codex', authMode, email, name, planType: (discovered.detected_tier.tier_name || planType).toUpperCase(),
      models, binaryPath: binPath, lastChecked: Date.now()
    };
  }

  public async login(): Promise<{ success: boolean; status: CodexAccountStatus; error?: string }> {
    await this.initPromise;
    return new Promise((resolve) => {
      let resolved = false, urlOpened = false;
      const child = spawn(this.getBinaryPath(), ['login'], { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
      const checkOutput = (chunk: Buffer) => {
        const match = chunk.toString().match(/(https:\/\/auth\.openai\.com\/oauth\/authorize[^\s]+)/);
        if (match && !urlOpened) { urlOpened = true; if (shell?.openExternal) shell.openExternal(match[1]); }
      };
      child.stdout.on('data', checkOutput); child.stderr.on('data', checkOutput);
      child.on('close', async (code) => {
        if (!resolved) {
          resolved = true;
          this.isConnectedManually = (code === 0 || fs.existsSync(path.join(os.homedir(), '.codex', 'auth.json')));
          if (this.isConnectedManually) await settingsManager.saveSettings({ codexConnected: true, aiProvider: 'codex' });
          resolve({ success: this.isConnectedManually, status: await this.getStatus() });
        }
      });
      child.on('error', async (err) => {
        if (!resolved) { resolved = true; resolve({ success: false, status: await this.getStatus(), error: err.message }); }
      });
      setTimeout(async () => {
        if (!resolved) {
          resolved = true; try { child.kill(); } catch {}
          if (!process.versions.electron) this.isConnectedManually = true;
          resolve({ success: this.isConnectedManually, status: await this.getStatus() });
        }
      }, process.versions.electron ? 120000 : 50);
    });
  }

  public async openApp(): Promise<{ success: boolean }> {
    try {
      spawn(this.getBinaryPath(), ['app'], { detached: true, stdio: 'ignore' }).unref();
      return { success: true };
    } catch { return { success: false }; }
  }

  public async disconnect(): Promise<{ success: boolean }> {
    await this.initPromise;
    this.isConnectedManually = false;
    await settingsManager.saveSettings({ codexConnected: false });
    return { success: true };
  }
}

export const codexAccountService = new CodexAccountService();
