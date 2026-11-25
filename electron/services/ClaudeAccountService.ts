import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { modelDiscoveryService } from './ModelDiscoveryService';

export interface ClaudeAccountStatus {
  connected: boolean;
  engine: 'claudecode';
  subscriptionType: string;
  rateLimitTier: string;
  organizationUuid?: string;
  authMethod: 'official_cli' | 'direct_api' | 'none';
  models: Array<{ id: string; name: string; badge: string }>;
  runtimeType: 'native_cli' | 'npx' | 'cloud_direct';
  complianceCompliant: true;
  lastChecked: number;
  scopes?: string[];
  expiresAt?: number;
}

export const DEFAULT_CLAUDE_MODELS = [
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', badge: '💡 Hybrid Reasoning & Thinking' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', badge: '🧠 Frontier Coding (1M Context)' },
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', badge: '🔬 Deep Analytical Reasoning (1M Context)' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', badge: '🎯 Frontier Coding Precision' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', badge: '⚡ Lightning Fast (0.8s)' }
];

export class ClaudeAccountService {
  private isConnectedManually = true;
  private directApiKey = '';

  public setDirectApiKey(key: string) {
    this.directApiKey = key.trim();
    if (this.directApiKey) this.isConnectedManually = true;
  }

  public getDirectApiKey(): string {
    return this.directApiKey;
  }

  private getCandidatePaths(): string[] {
    const home = os.homedir();
    const up = process.env.USERPROFILE || '';
    const envHome = process.env.HOME || '';
    return [
      path.join(home, '.claude', '.credentials.json'),
      up ? path.join(up, '.claude', '.credentials.json') : '',
      envHome ? path.join(envHome, '.claude', '.credentials.json') : '',
      path.join(home, '.claude.json'),
      up ? path.join(up, '.claude.json') : ''
    ].filter(Boolean);
  }

  public async getStatus(): Promise<ClaudeAccountStatus> {
    let subscriptionType = 'TEAM';
    let rateLimitTier = 'default_raven';
    let organizationUuid: string | undefined;
    let scopes: string[] = [];
    let expiresAt: number | undefined;
    let hasValidSession = false;
    let authMethod: 'official_cli' | 'direct_api' | 'none' = 'none';
    let runtimeType: 'native_cli' | 'npx' | 'cloud_direct' = 'npx';

    if (this.directApiKey) {
      hasValidSession = true;
      authMethod = 'direct_api';
      runtimeType = 'cloud_direct';
      subscriptionType = 'ANTHROPIC CLOUD DIRECT';
      scopes = ['direct:inference', 'direct:messages'];
    } else {
      for (const p of this.getCandidatePaths()) {
        if (!fs.existsSync(p)) continue;
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const creds = JSON.parse(raw);
          const oauth = creds.claudeAiOauth || creds;
          if (oauth?.accessToken) {
            hasValidSession = true;
            authMethod = 'official_cli';
            subscriptionType = (oauth.subscriptionType || subscriptionType).toUpperCase();
            rateLimitTier = oauth.rateLimitTier || rateLimitTier;
            organizationUuid = creds.organizationUuid || organizationUuid;
            scopes = oauth.scopes || scopes;
            expiresAt = oauth.expiresAt || expiresAt;
            break;
          }
        } catch {}
      }
    }

    const discovered = modelDiscoveryService.getDiscoveredModels('claudecode');
    const models = discovered.models.map((m) => ({ id: m.id, name: m.name, badge: m.badge }));
    const connected = this.isConnectedManually && hasValidSession;

    return {
      connected,
      engine: 'claudecode',
      subscriptionType: (discovered.detected_tier.tier_name || subscriptionType).toUpperCase(),
      rateLimitTier,
      organizationUuid,
      authMethod,
      models: models.length > 0 ? models : DEFAULT_CLAUDE_MODELS,
      runtimeType,
      complianceCompliant: true,
      lastChecked: Date.now(),
      scopes,
      expiresAt
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
    this.directApiKey = '';
    return { success: true };
  }
}

export const claudeAccountService = new ClaudeAccountService();
