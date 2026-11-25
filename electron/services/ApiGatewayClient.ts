import { SettingsManager } from './SettingsManager';

const settingsManager = new SettingsManager();

export interface GatewayCallbackResult {
  sent: boolean;
  status?: number;
  data?: any;
  error?: string;
}

export class ApiGatewayClient {
  public static async getBaseUrl(): Promise<string> {
    if (process.env.LAM_GATEWAY_URL) return process.env.LAM_GATEWAY_URL.replace(/\/+$/, '');
    const settings = await settingsManager.loadSettings().catch(() => ({}) as any);
    return (settings?.gatewayUrl || process.env.AUTH_PROXY_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }

  public static async request<T = any>(
    endpoint: string,
    options: { method?: string; body?: any; headers?: Record<string, string>; timeoutMs?: number } = {}
  ): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
    const baseUrl = await this.getBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 4000);
    try {
      const res = await fetch(`${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
      const text = await res.text();
      let parsed: any = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok) return { ok: false, status: res.status, error: parsed?.message || `HTTP ${res.status}` };
      return { ok: true, status: res.status, data: parsed };
    } catch (err: any) {
      return { ok: false, status: 0, error: err?.message || 'Gateway unreachable' };
    } finally {
      clearTimeout(timer);
    }
  }

  public static async getHealth() {
    return this.request('/health', { timeoutMs: 2500 });
  }

  public static async syncProfiles(workspaceId: string, profiles: Record<string, any>) {
    return this.request('/sync/profiles', { method: 'PUT', body: { workspaceId, profiles } });
  }

  public static async pullProfiles(workspaceId: string) {
    return this.request(`/sync/profiles?workspaceId=${encodeURIComponent(workspaceId)}`);
  }

  public static async syncSettings(workspaceId: string, settings: Record<string, any>) {
    return this.request('/sync/settings', { method: 'PUT', body: { workspaceId, settings } });
  }

  public static async pullSettings(workspaceId: string) {
    return this.request(`/sync/settings?workspaceId=${encodeURIComponent(workspaceId)}`);
  }

  public static async linkProviderStatus(payload: {
    clientId?: string;
    provider: string;
    connected: boolean;
    accountLabel?: string;
    modelCount?: number;
  }) {
    return this.request('/auth/providers/link', { method: 'POST', body: payload, timeoutMs: 2500 });
  }

  public static async emitCallback(
    kind: 'agent-run' | 'delegation' | 'external-context' | 'command-result',
    payload: Record<string, any>
  ): Promise<GatewayCallbackResult> {
    const res = await this.request(`/callbacks/${kind}`, { method: 'POST', body: payload, timeoutMs: 2000 });
    return { sent: res.ok, status: res.status, data: res.data, error: res.error };
  }
}
