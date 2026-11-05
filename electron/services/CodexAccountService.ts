import os from 'os';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface CodexAccountStatus {
  connected: boolean;
  engine: 'codex';
  authMode: 'chatgpt' | 'api_key' | 'none';
  email?: string;
  name?: string;
  planType?: string;
  models: Array<{ id: string; name: string; description?: string }>;
  binaryPath: string;
  lastChecked: number;
  error?: string;
}

const DEFAULT_CODEX_MODELS = [
  { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol (Flagship Coding & Reasoning)' },
  { id: 'gpt-6-astra', name: 'GPT-6 Astra (Deep Math & Architecture)' },
  { id: 'gpt-6-sol', name: 'GPT-6 Sol (Frontier Coding Agent)' },
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol (Fast Balanced)' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra (Compact)' }
];

export class CodexAccountService {
  private isConnectedManually = true;

  public getBinaryPath(): string {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const codexBinRoot = path.join(localAppData, 'OpenAI', 'Codex', 'bin');
    if (fs.existsSync(codexBinRoot)) {
      try {
        const subdirs = fs.readdirSync(codexBinRoot);
        for (const sub of subdirs) {
          const candidate = path.join(codexBinRoot, sub, process.platform === 'win32' ? 'codex.exe' : 'codex');
          if (fs.existsSync(candidate)) return candidate;
        }
      } catch {}
    }
    return process.platform === 'win32' ? 'codex.exe' : 'codex';
  }

  public async getStatus(): Promise<CodexAccountStatus> {
    const binPath = this.getBinaryPath();
    const home = os.homedir();
    const authPath = path.join(home, '.codex', 'auth.json');
    let email = 'chatgpt-user@openai.com';
    let name = 'ChatGPT Subscriber';
    let planType = 'ChatGPT Plan';
    let authMode: 'chatgpt' | 'api_key' | 'none' = 'none';
    let hasValidAuth = false;

    if (fs.existsSync(authPath)) {
      try {
        const raw = fs.readFileSync(authPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.auth_mode === 'chatgpt' || parsed.tokens?.access_token) {
          authMode = 'chatgpt';
          hasValidAuth = true;
          const jwtProfile = parsed.tokens?.access_token?.split('.')?.[1];
          if (jwtProfile) {
            try {
              const decoded = JSON.parse(Buffer.from(jwtProfile, 'base64').toString('utf-8'));
              email = decoded['https://api.openai.com/profile']?.email || decoded.email || email;
              name = decoded['https://api.openai.com/profile']?.name || decoded.name || name;
              planType = decoded['https://api.openai.com/auth']?.chatgpt_plan_type || 'team';
            } catch {}
          }
        }
      } catch {}
    }

    let models = DEFAULT_CODEX_MODELS;
    const modelsCachePath = path.join(home, '.codex', 'models_cache.json');
    if (fs.existsSync(modelsCachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(modelsCachePath, 'utf-8'));
        if (Array.isArray(cache.models) && cache.models.length > 0) {
          models = cache.models.map((m: any) => ({
            id: m.slug || m.id,
            name: m.display_name || m.slug || m.id,
            description: m.description || 'OpenAI Codex Reasoning Model'
          }));
        }
      } catch {}
    }

    const connected = this.isConnectedManually && hasValidAuth;
    return {
      connected,
      engine: 'codex',
      authMode,
      email,
      name,
      planType: planType.toUpperCase(),
      models,
      binaryPath: binPath,
      lastChecked: Date.now()
    };
  }

  public async login(): Promise<{ success: boolean; status: CodexAccountStatus; error?: string }> {
    const binPath = this.getBinaryPath();
    try {
      await execFileAsync(binPath, ['login', 'status'], { timeout: 6000 });
      this.isConnectedManually = true;
      const status = await this.getStatus();
      return { success: true, status };
    } catch (err: any) {
      this.isConnectedManually = false;
      const status = await this.getStatus();
      return { success: false, status, error: err?.message || 'Failed to authenticate with Codex engine.' };
    }
  }

  public async disconnect(): Promise<{ success: boolean }> {
    this.isConnectedManually = false;
    return { success: true };
  }
}

export const codexAccountService = new CodexAccountService();
