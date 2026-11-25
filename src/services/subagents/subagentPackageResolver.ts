import {
  ConnectedPackageInfo,
  SubagentModelOption,
  PACKAGE_DEFINITIONS,
  CATALOG_MODELS,
  ModelRoleTag
} from './packageModelCatalog';

export type { ConnectedPackageInfo, SubagentModelOption, ModelRoleTag };
export { PACKAGE_DEFINITIONS };

export const inferPackageMeta = (modelId?: string, provider?: string) => {
  const m = (modelId || '').toLowerCase().trim();
  const p = (provider || '').toLowerCase().trim();
  if (m === 'auto' || m === 'auto-smart-router' || p === 'auto' || p === 'auto-router') {
    return { id: 'auto-router', name: 'Auto-Router', badge: '[Package: Multi-Channel Auto-Router]', colorClass: 'text-primary bg-primary/10 border-primary/30' };
  }
  if (/^argon/.test(m)) return { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity };
  if (/^gpt-4|^gpt-3\.5/.test(m) || p === 'openai') return { id: 'openai', ...PACKAGE_DEFINITIONS.openai };
  if (/^gpt-6|^o1|^o3|^codex/.test(m) && p !== 'openai') return { id: 'codex', ...PACKAGE_DEFINITIONS.codex };
  if (/^claude/.test(m)) return p === 'antigravity' ? { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity } : { id: 'claudecode', ...PACKAGE_DEFINITIONS.claudecode };
  if (/^gemini/.test(m)) return p === 'antigravity' ? { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity } : { id: 'gemini', ...PACKAGE_DEFINITIONS.gemini };
  if (/^deepseek/.test(m)) return p === 'ollama' ? { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama } : { id: 'deepseek', ...PACKAGE_DEFINITIONS.deepseek };
  if (/^qwen|^llama|^local-/.test(m)) return { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama };
  return { id: p in PACKAGE_DEFINITIONS ? p : 'gemini', ...(PACKAGE_DEFINITIONS[p] || PACKAGE_DEFINITIONS.gemini) };
};

export const detectConnectedPackages = (context?: any): ConnectedPackageInfo[] => {
  const g = context?.googleAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.googleAccount : null);
  const c = context?.codexAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.codexAccount : null);
  const cl = context?.claudeAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.claudeAccount : null);
  const eng = context?.engineSettings || context || {};
  const prov = (eng.provider || '').toLowerCase();
  const key = eng.customApiKey || '';
  const hasClaudeKey = Boolean(key.startsWith?.('sk-ant') || eng.claudeApiKey);
  const hasGeminiKey = Boolean(key.startsWith?.('AIza') || eng.apiKey?.startsWith?.('AIza'));
  const hasOpenAiKey = Boolean((key.startsWith?.('sk-') && !hasClaudeKey && prov !== 'deepseek') || (prov === 'openai' && Boolean(key)));
  const hasDeepSeekKey = Boolean((prov === 'deepseek' && Boolean(key)) || String(eng.baseUrl || '').includes('deepseek'));

  return [
    { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity, connected: Boolean(g?.connected) },
    { id: 'openai', ...PACKAGE_DEFINITIONS.openai, connected: hasOpenAiKey || Boolean(c?.connected) },
    { id: 'codex', ...PACKAGE_DEFINITIONS.codex, connected: Boolean(c?.connected) },
    { id: 'claudecode', ...PACKAGE_DEFINITIONS.claudecode, connected: Boolean(cl?.connected || hasClaudeKey) },
    { id: 'gemini', ...PACKAGE_DEFINITIONS.gemini, connected: hasGeminiKey || Boolean(g?.connected) },
    { id: 'deepseek', ...PACKAGE_DEFINITIONS.deepseek, connected: hasDeepSeekKey },
    { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama, connected: Boolean(context?.ollamaStatus?.connected || prov === 'ollama') }
  ];
};

export const getPackageAwareModelOptions = (context?: any): SubagentModelOption[] => {
  const packages = detectConnectedPackages(context);
  const anyConnected = packages.some((p) => p.connected);
  const g = context?.googleAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.googleAccount : null);
  const c = context?.codexAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.codexAccount : null);
  const cl = context?.claudeAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.claudeAccount : null);
  const liveList: Array<{ id: string; name?: string; displayName?: string; provider?: string }> = context?.liveModels || [];
  const activeProv = (context?.engineSettings?.provider || '').toLowerCase();

  const options: SubagentModelOption[] = [
    { id: 'auto-smart-router', label: 'Auto (Smart Router Across Connected Providers)', packageId: 'auto', packageName: 'Auto-Router', connected: anyConnected, roleTag: 'Router' }
  ];

  for (const pkg of packages) {
    let list: Array<{ id: string; name: string; roleTag?: ModelRoleTag }> = [];
    if (pkg.id === 'codex' && Array.isArray(c?.models) && c.models.length > 0) list = c.models;
    else if (pkg.id === 'antigravity' && Array.isArray(g?.models) && g.models.length > 0) list = g.models;
    else if (pkg.id === 'claudecode' && Array.isArray(cl?.models) && cl.models.length > 0) list = cl.models;
    else list = CATALOG_MODELS[pkg.id] || [];

    for (const m of list) {
      options.push({
        id: m.id,
        label: `[${pkg.name}] ${m.name}`,
        packageId: pkg.id,
        packageName: pkg.name,
        connected: pkg.connected,
        roleTag: m.roleTag || (/coder|codex|sol|astra/i.test(m.id) ? 'Coding' : (/o1|o3|thinking|r1|argon/i.test(m.id) ? 'Reasoning' : 'Chat & Coding'))
      });
    }
  }

  for (const lm of liveList) {
    if (!lm?.id) continue;
    const pkgId = activeProv && PACKAGE_DEFINITIONS[activeProv] ? activeProv : inferPackageMeta(lm.id, lm.provider).id;
    const exists = options.some((o) => o.id === lm.id && o.packageId === pkgId);
    if (!exists && PACKAGE_DEFINITIONS[pkgId]) {
      options.push({
        id: lm.id, label: `[${PACKAGE_DEFINITIONS[pkgId].name}] ${lm.displayName || lm.name || lm.id}`,
        packageId: pkgId, packageName: PACKAGE_DEFINITIONS[pkgId].name, connected: true, roleTag: 'Chat & Coding'
      });
    }
  }
  return options;
};
