export interface KeyValidationResult {
  valid: boolean;
  provider: string;
  error?: string;
  latencyMs: number;
  modelsCount?: number;
}

export interface AvailableModelItem {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  provider: string;
  contextWindow?: number;
}

export class CloudKeyValidator {
  public async validateKey(
    provider: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'openrouter',
    apiKey: string,
    customBaseUrl?: string
  ): Promise<KeyValidationResult> {
    const key = apiKey.trim();
    if (!key) return { valid: false, provider, error: 'API Key cannot be empty', latencyMs: 0 };
    const start = Date.now();
    try {
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (!res.ok) return { valid: false, provider, error: `HTTP ${res.status}`, latencyMs: Date.now() - start };
        const data = (await res.json()) as any;
        return { valid: true, provider, latencyMs: Date.now() - start, modelsCount: data?.models?.length || 0 };
      }
      if (provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
        });
        if (!res.ok) return { valid: false, provider, error: `HTTP ${res.status}`, latencyMs: Date.now() - start };
        const data = (await res.json()) as any;
        return { valid: true, provider, latencyMs: Date.now() - start, modelsCount: data?.data?.length || 7 };
      }
      const baseUrl = (customBaseUrl || (provider === 'deepseek' ? 'https://api.deepseek.com/v1' : provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')).replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) return { valid: false, provider, error: `HTTP ${res.status}`, latencyMs: Date.now() - start };
      const data = (await res.json()) as any;
      return { valid: true, provider, latencyMs: Date.now() - start, modelsCount: data?.data?.length };
    } catch (err: any) {
      return { valid: false, provider, error: err.message || 'Network connection error', latencyMs: Date.now() - start };
    }
  }

  public async fetchModels(
    provider: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'openrouter',
    apiKey: string,
    customBaseUrl?: string
  ): Promise<{ success: boolean; models?: AvailableModelItem[]; error?: string }> {
    const key = apiKey.trim();
    if (!key) return { success: false, error: 'API Key cannot be empty' };
    try {
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
        const data = (await res.json()) as any;
        const list = (data?.models || []).filter((m: any) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'));
        const models: AvailableModelItem[] = list.map((m: any) => {
          const id = (m.name || '').replace(/^models\//, '');
          return { id, name: id, displayName: m.displayName || id, description: m.description, provider: 'Google Gemini', contextWindow: m.inputTokenLimit };
        });
        return { success: true, models };
      }
      if (provider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
        });
        if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
        const data = (await res.json()) as any;
        const models: AvailableModelItem[] = (data?.data || []).map((m: any) => ({
          id: m.id, name: m.display_name || m.id, displayName: m.display_name || m.id, provider: 'Anthropic Cloud'
        }));
        return { success: true, models: models.length ? models : undefined };
      }
      const baseUrl = (customBaseUrl || (provider === 'deepseek' ? 'https://api.deepseek.com/v1' : provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')).replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      const data = (await res.json()) as any;
      const models: AvailableModelItem[] = (data?.data || []).map((m: any) => ({ id: m.id, name: m.id, displayName: m.id, provider: provider.toUpperCase() }));
      return { success: true, models };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch models from provider' };
    }
  }
}

export const cloudKeyValidator = new CloudKeyValidator();
