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
    if (!key) {
      return { valid: false, provider, error: 'API Key cannot be empty', latencyMs: 0 };
    }

    const start = Date.now();
    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        const latencyMs = Date.now() - start;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errMsg = body?.error?.message || `HTTP ${res.status}`;
          return { valid: false, provider, error: errMsg, latencyMs };
        }
        const data = (await res.json()) as any;
        return { valid: true, provider, latencyMs, modelsCount: data?.models?.length || 0 };
      }

      const baseUrl = (customBaseUrl || (
        provider === 'deepseek' ? 'https://api.deepseek.com/v1' :
        provider === 'openrouter' ? 'https://openrouter.ai/api/v1' :
        'https://api.openai.com/v1'
      )).replace(/\/+$/, '');

      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body?.error?.message || `HTTP ${res.status}`;
        return { valid: false, provider, error: errMsg, latencyMs };
      }
      const data = (await res.json()) as any;
      const count = Array.isArray(data?.data) ? data.data.length : undefined;
      return { valid: true, provider, latencyMs, modelsCount: count };
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
    if (!key) {
      return { success: false, error: 'API Key cannot be empty' };
    }

    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { success: false, error: body?.error?.message || `HTTP ${res.status}` };
        }
        const data = (await res.json()) as any;
        const rawModels: any[] = Array.isArray(data?.models) ? data.models : [];
        const models: AvailableModelItem[] = rawModels
          .filter((m: any) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => {
            const cleanId = (m.name || '').replace(/^models\//, '');
            return {
              id: cleanId,
              name: cleanId,
              displayName: m.displayName || cleanId,
              description: m.description,
              provider: 'Google Gemini',
              contextWindow: m.inputTokenLimit
            };
          });
        return { success: true, models };
      }

      const baseUrl = (customBaseUrl || (
        provider === 'deepseek' ? 'https://api.deepseek.com/v1' :
        provider === 'openrouter' ? 'https://openrouter.ai/api/v1' :
        'https://api.openai.com/v1'
      )).replace(/\/+$/, '');

      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { success: false, error: body?.error?.message || `HTTP ${res.status}` };
      }
      const data = (await res.json()) as any;
      const rawList: any[] = Array.isArray(data?.data) ? data.data : [];
      const models: AvailableModelItem[] = rawList.map((m: any) => ({
        id: m.id,
        name: m.id,
        displayName: m.id,
        provider: provider.toUpperCase()
      }));
      return { success: true, models };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch models from provider' };
    }
  }
}

export const cloudKeyValidator = new CloudKeyValidator();
