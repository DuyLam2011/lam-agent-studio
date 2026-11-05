import os from 'os';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GoogleAccountStatus {
  connected: boolean;
  engine: 'antigravity';
  email: string;
  name: string;
  models: Array<{ id: string; name: string }>;
  binaryPath: string;
  lastChecked: number;
  error?: string;
}

const DEFAULT_MODELS = [
  { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High Reasoning)' },
  { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium)' },
  { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low / Fast)' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Thinking)' },
  { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6 (Deep Reasoning)' },
  { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B (Medium)' }
];

export class GoogleAccountService {
  private isConnectedManually = true;

  public getBinaryPath(): string {
    const home = os.homedir();
    const exeName = process.platform === 'win32' ? 'agy.exe' : 'agy';
    const standardPath = path.join(home, '.gemini', 'bin', exeName);
    if (fs.existsSync(standardPath)) return standardPath;
    return exeName;
  }

  public async getStatus(): Promise<GoogleAccountStatus> {
    const binPath = this.getBinaryPath();
    const exists = fs.existsSync(binPath) || binPath === 'agy' || binPath === 'agy.exe';
    const email = process.env.GOOGLE_USER_EMAIL || `${process.env.USERNAME || 'google-user'}@gmail.com`;
    const name = process.env.USERNAME || 'Google Developer';

    if (!exists) {
      return {
        connected: false,
        engine: 'antigravity',
        email,
        name,
        models: DEFAULT_MODELS,
        binaryPath: binPath,
        lastChecked: Date.now(),
        error: 'Antigravity CLI binary not found in ~/.gemini/bin'
      };
    }

    let models = DEFAULT_MODELS;
    try {
      const { stdout } = await execFileAsync(binPath, ['models'], { timeout: 6000 });
      const parsed = stdout
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.toLowerCase().includes('fetching'))
        .map(l => {
          const [id, ...rest] = l.split(/\t+|\s{2,}/);
          return { id: id.trim(), name: rest.join(' ').trim() || id.trim() };
        })
        .filter(m => m.id.length > 0);
      if (parsed.length > 0) models = parsed;
    } catch {
      // Keep DEFAULT_MODELS if `agy models` times out or has format quirks
    }

    return {
      connected: this.isConnectedManually && exists,
      engine: 'antigravity',
      email,
      name,
      models,
      binaryPath: binPath,
      lastChecked: Date.now()
    };
  }

  public async login(): Promise<{ success: boolean; status: GoogleAccountStatus; error?: string }> {
    const binPath = this.getBinaryPath();
    try {
      await execFileAsync(binPath, ['-p', 'ping', '--output-format', 'json', '--model', 'gemini-3.8-flash-low'], {
        timeout: 15000
      });
      this.isConnectedManually = true;
      const status = await this.getStatus();
      return { success: true, status };
    } catch (err: any) {
      this.isConnectedManually = false;
      const status = await this.getStatus();
      return { success: false, status, error: err?.message || 'Failed to authenticate with Antigravity engine.' };
    }
  }

  public async disconnect(): Promise<{ success: boolean }> {
    this.isConnectedManually = false;
    return { success: true };
  }
}

export const googleAccountService = new GoogleAccountService();
