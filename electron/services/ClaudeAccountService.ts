import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

export interface ClaudeAccountStatus {
  connected: boolean;
  engine: 'claudecode';
  subscriptionType: string;
  rateLimitTier: string;
  organizationUuid?: string;
  authMethod: 'official_cli' | 'none';
  models: Array<{ id: string; name: string; badge: string }>;
  runtimeType: 'native_cli' | 'npx';
  complianceCompliant: true;
  lastChecked: number;
}

const DEFAULT_CLAUDE_MODELS = [
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', badge: '🧠 Hybrid Thinking' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', badge: '⚡ High Precision' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', badge: '🚀 Ultra Fast' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', badge: '🏆 Deep Frontier' }
];

export class ClaudeAccountService {
  private isConnectedManually = true;

  public async getStatus(): Promise<ClaudeAccountStatus> {
    const home = os.homedir();
    const credsPath = path.join(home, '.claude', '.credentials.json');
    let subscriptionType = 'PRO';
    let rateLimitTier = 'default';
    let organizationUuid: string | undefined;
    let hasValidSession = false;

    if (fs.existsSync(credsPath)) {
      try {
        const raw = fs.readFileSync(credsPath, 'utf-8');
        const creds = JSON.parse(raw);
        if (creds?.claudeAiOauth?.accessToken) {
          hasValidSession = true;
          subscriptionType = (creds.claudeAiOauth.subscriptionType || 'PRO').toUpperCase();
          rateLimitTier = creds.claudeAiOauth.rateLimitTier || 'standard';
          organizationUuid = creds.organizationUuid;
        }
      } catch {}
    }

    const connected = this.isConnectedManually && hasValidSession;
    return {
      connected,
      engine: 'claudecode',
      subscriptionType,
      rateLimitTier,
      organizationUuid,
      authMethod: hasValidSession ? 'official_cli' : 'none',
      models: DEFAULT_CLAUDE_MODELS,
      runtimeType: 'npx',
      complianceCompliant: true,
      lastChecked: Date.now()
    };
  }

  public async login(): Promise<{ success: boolean; status: ClaudeAccountStatus; error?: string }> {
    try {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? 'cmd.exe' : 'bash';
      const args = isWin ? ['/c', 'start', 'npx', '@anthropic-ai/claude-code', 'auth', 'login'] : ['-c', 'npx @anthropic-ai/claude-code auth login'];
      spawn(cmd, args, { detached: true, stdio: 'ignore' });
      this.isConnectedManually = true;
      const status = await this.getStatus();
      return { success: true, status };
    } catch (err: any) {
      const status = await this.getStatus();
      return { success: false, status, error: err?.message || 'Failed to launch official Claude Code CLI auth.' };
    }
  }

  public async disconnect(): Promise<{ success: boolean }> {
    this.isConnectedManually = false;
    return { success: true };
  }
}

export const claudeAccountService = new ClaudeAccountService();
