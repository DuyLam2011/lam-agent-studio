import os from 'os';
import path from 'path';
import fs from 'fs';
import {
  NativeModelBridge,
  ModelDiscoveryResult,
  DiscoveredModel,
  FatherAgentAssignmentResult
} from './NativeModelBridge';

export class ModelDiscoveryService {
  private cache: Map<string, { result: ModelDiscoveryResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60000;

  public getDiscoveredModels(provider: string, forceRefresh = false): ModelDiscoveryResult {
    const key = provider.toLowerCase();
    const existing = this.cache.get(key);
    if (!forceRefresh && existing && Date.now() - existing.timestamp < this.CACHE_TTL_MS) {
      return existing.result;
    }

    const rawPayload = this.loadRawAccountData(key);
    const result = NativeModelBridge.discoverPackageModels(key, rawPayload);
    this.cache.set(key, { result, timestamp: Date.now() });
    return result;
  }

  public assignFatherAgentModel(provider: string, modelId: string): FatherAgentAssignmentResult {
    const rawPayload = this.loadRawAccountData(provider);
    const result = NativeModelBridge.assignFatherAgentModel(provider, modelId, rawPayload);
    return result;
  }

  public getModelsForAccountStatus(provider: string): Array<{ id: string; name: string; badge?: string; tier?: string }> {
    const discovery = this.getDiscoveredModels(provider);
    return discovery.models.map((m: DiscoveredModel) => ({
      id: m.id,
      name: m.name,
      badge: m.badge,
      tier: m.tier
    }));
  }

  public clearCache(): void {
    this.cache.clear();
  }

  private loadRawAccountData(provider: string): string {
    const home = os.homedir();
    try {
      if (provider === 'codex' || provider === 'openai') {
        const cachePath = path.join(home, '.codex', 'models_cache.json');
        const authPath = path.join(home, '.codex', 'auth.json');
        let modelsPart = '';
        let authPart = '';
        if (fs.existsSync(cachePath)) modelsPart = fs.readFileSync(cachePath, 'utf-8');
        if (fs.existsSync(authPath)) authPart = fs.readFileSync(authPath, 'utf-8');
        if (modelsPart || authPart) {
          const authObj = authPart ? JSON.parse(authPart) : {};
          const modelsObj = modelsPart ? JSON.parse(modelsPart) : {};
          return JSON.stringify({ ...modelsObj, auth: authObj, planType: authObj?.chatgpt_plan_type || 'team' });
        }
      } else if (provider === 'claudecode' || provider === 'anthropic') {
        const credPath = path.join(home, '.claude', '.credentials.json');
        if (fs.existsSync(credPath)) {
          const raw = fs.readFileSync(credPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const oauth = parsed.claudeAiOauth || parsed;
          return JSON.stringify({ subscriptionType: oauth.subscriptionType || 'TEAM', ...parsed });
        }
      } else if (provider === 'antigravity' || provider === 'gemini') {
        return JSON.stringify({ isEnterprise: false, tier: 'google_one_ai_premium' });
      }
    } catch (err) {
      console.warn(`[ModelDiscoveryService] Error loading account data for ${provider}:`, err);
    }
    return '{}';
  }
}

export const modelDiscoveryService = new ModelDiscoveryService();
