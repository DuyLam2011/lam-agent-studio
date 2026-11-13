export interface ConnectedPackageInfo {
  id: string;
  name: string;
  badge: string;
  connected: boolean;
  colorClass: string;
}

export interface SubagentModelOption {
  id: string;
  label: string;
  packageId: string;
  packageName: string;
  connected: boolean;
}

export const PACKAGE_DEFINITIONS: Record<string, { name: string; badge: string; colorClass: string }> = {
  antigravity: {
    name: 'Google Antigravity',
    badge: '[Gói: Google Antigravity]',
    colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  codex: {
    name: 'OpenAI Codex',
    badge: '[Gói: OpenAI Codex]',
    colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/30'
  },
  claudecode: {
    name: 'Claude Code',
    badge: '[Gói: Claude Code]',
    colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  gemini: {
    name: 'Google Gemini',
    badge: '[Gói: Google Gemini API]',
    colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  ollama: {
    name: 'Local Ollama',
    badge: '[Gói: Local Ollama]',
    colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  }
};

const CATALOG_MODELS: Record<string, Array<{ id: string; name: string }>> = {
  antigravity: [
    { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash High (High Reasoning)' },
    { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6 (Deep Frontier)' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Thinking)' },
    { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash Medium (Balanced)' },
    { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash Low (Ultra Fast)' },
    { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B (Open Weights)' }
  ],
  codex: [
    { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol (Flagship Coding)' },
    { id: 'gpt-6-sol', name: 'GPT-6 Sol (Frontier Coding Agent)' },
    { id: 'gpt-6-astra', name: 'GPT-6 Astra (Deep Math/Logic)' },
    { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol (Fast Balanced)' },
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra (Compact Rapid)' }
  ],
  claudecode: [
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Thinking)' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (High Precision)' },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Ultra Fast)' }
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Frontier Reasoning)' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Fast)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Rapid)' }
  ],
  ollama: [
    { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder (Local)' }
  ]
};

export const inferPackageMeta = (modelId?: string, provider?: string) => {
  const m = (modelId || '').toLowerCase().trim();
  const p = (provider || '').toLowerCase().trim();

  if (m === 'auto' || m === 'auto-smart-router' || p === 'auto' || p === 'auto-router') {
    return { id: 'auto-router', name: 'Auto-Router', badge: '[Gói: Auto-Router Đa Kênh]', colorClass: 'text-primary bg-primary/10 border-primary/30' };
  }
  if (p === 'codex' || /^gpt-(5|6)/.test(m)) return { id: 'codex', ...PACKAGE_DEFINITIONS.codex };
  if (p === 'claudecode' || /^claude-3/.test(m)) return { id: 'claudecode', ...PACKAGE_DEFINITIONS.claudecode };
  if (p === 'antigravity' || /^gemini-3\.8|^claude-(sonnet|opus)-4-6|^gpt-oss/.test(m)) return { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity };
  if (p === 'ollama' || /^qwen|^llama|^local-/.test(m)) return { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama };
  return { id: 'gemini', ...PACKAGE_DEFINITIONS.gemini };
};

export const detectConnectedPackages = (context?: any): ConnectedPackageInfo[] => {
  const g = context?.googleAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.googleAccount : null);
  const c = context?.codexAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.codexAccount : null);
  const cl = context?.claudeAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.claudeAccount : null);
  const eng = context?.engineSettings || context || {};
  const hasGeminiKey = Boolean(eng.customApiKey?.startsWith?.('AIza') || eng.apiKey?.startsWith?.('AIza'));

  const packages: ConnectedPackageInfo[] = [
    { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity, connected: Boolean(g?.connected) },
    { id: 'codex', ...PACKAGE_DEFINITIONS.codex, connected: Boolean(c?.connected) },
    { id: 'claudecode', ...PACKAGE_DEFINITIONS.claudecode, connected: Boolean(cl?.connected) },
    { id: 'gemini', ...PACKAGE_DEFINITIONS.gemini, connected: hasGeminiKey },
    { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama, connected: Boolean(context?.ollamaStatus?.connected) }
  ];

  const anyConnected = packages.some((p) => p.connected);
  if (!anyConnected) {
    const fallbackProv = (eng.provider || 'antigravity').toLowerCase();
    const target = packages.find((p) => p.id === fallbackProv) || packages[0];
    target.connected = true;
  }

  return packages;
};

export const getPackageAwareModelOptions = (context?: any): SubagentModelOption[] => {
  const packages = detectConnectedPackages(context);
  const options: SubagentModelOption[] = [
    {
      id: 'auto-smart-router',
      label: '🎯 Auto-Router (Tự động chọn theo các gói đã connect)',
      packageId: 'auto',
      packageName: 'Auto-Router',
      connected: true
    }
  ];

  for (const pkg of packages) {
    const list = CATALOG_MODELS[pkg.id] || [];
    for (const m of list) {
      const statusIcon = pkg.connected ? '🟢' : '⚪';
      const statusSuffix = pkg.connected ? '' : ' (Chưa kết nối)';
      options.push({
        id: m.id,
        label: `${statusIcon} [${pkg.name}] ${m.name}${statusSuffix}`,
        packageId: pkg.id,
        packageName: pkg.name,
        connected: pkg.connected
      });
    }
  }

  return options;
};
