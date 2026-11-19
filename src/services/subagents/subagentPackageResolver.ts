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
  antigravity: { name: 'Google Antigravity', badge: '[Package: Google Antigravity]', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  codex: { name: 'OpenAI Codex', badge: '[Package: OpenAI Codex]', colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  claudecode: { name: 'Claude Code', badge: '[Package: Claude Code]', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  gemini: { name: 'Google Gemini', badge: '[Package: Google Gemini API]', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  ollama: { name: 'Local Ollama', badge: '[Package: Local Ollama]', colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }
};

const CATALOG_MODELS: Record<string, Array<{ id: string; name: string }>> = {
  antigravity: [
    { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High Reasoning & Tool Calls)' },
    { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Balanced)' },
    { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low Latency)' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Thinking)' },
    { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6 (Deep Thinking)' },
    { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B (Open Weights)' }
  ],
  codex: [
    { id: 'gpt-6.2-sol', name: 'GPT-6.2-Sol (Coding & Everyday Work)' },
    { id: 'gpt-6.2-astra', name: 'GPT-6.2-Astra (Frontier Complex Reasoning)' },
    { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra (Visual & Computer Use)' },
    { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol (Everyday Work)' },
    { id: 'gpt-6-astra', name: 'GPT-6-Astra (Complex Coding & Professional Work)' },
    { id: 'gpt-6-sol', name: 'GPT-6-Sol (Balanced Coding)' },
    { id: 'gpt-6-luna', name: 'GPT-6-Luna (Fast & Affordable)' }
  ],
  claudecode: [
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5 (Frontier Coding - 1M Context)' },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8 (Deep Analytical Reasoning)' },
    { id: 'claude-fable-5-2', name: 'Claude Fable 5.2 (Autonomous Workflows)' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Thinking)' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Precision Coding)' },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Lightning Fast)' }
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Frontier Fast)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Frontier Reasoning)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Rapid Multimodal)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Lightweight)' }
  ],
  ollama: [
    { id: 'qwen2.5-coder', name: 'Ollama Qwen2.5-Coder (Local)' },
    { id: 'deepseek-r1', name: 'Ollama DeepSeek-R1 (Local Reasoning)' }
  ]
};

export const inferPackageMeta = (modelId?: string, provider?: string) => {
  const m = (modelId || '').toLowerCase().trim();
  const p = (provider || '').toLowerCase().trim();

  if (m === 'auto' || m === 'auto-smart-router' || p === 'auto' || p === 'auto-router') {
    return { id: 'auto-router', name: 'Auto-Router', badge: '[Package: Multi-Channel Auto-Router]', colorClass: 'text-primary bg-primary/10 border-primary/30' };
  }
  if (/^gpt-4|^o1|^o3|^codex/.test(m)) return { id: 'codex', ...PACKAGE_DEFINITIONS.codex };
  if (/^claude/.test(m)) return p === 'antigravity' ? { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity } : { id: 'claudecode', ...PACKAGE_DEFINITIONS.claudecode };
  if (/^gemini/.test(m)) return p === 'antigravity' ? { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity } : { id: 'gemini', ...PACKAGE_DEFINITIONS.gemini };
  if (/^qwen|^llama|^deepseek|^local-/.test(m)) return { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama };

  const provMap: Record<string, any> = { codex: PACKAGE_DEFINITIONS.codex, claudecode: PACKAGE_DEFINITIONS.claudecode, antigravity: PACKAGE_DEFINITIONS.antigravity, gemini: PACKAGE_DEFINITIONS.gemini, ollama: PACKAGE_DEFINITIONS.ollama };
  return { id: p in provMap ? p : 'gemini', ...(provMap[p] || PACKAGE_DEFINITIONS.gemini) };
};

export const detectConnectedPackages = (context?: any): ConnectedPackageInfo[] => {
  const g = context?.googleAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.googleAccount : null);
  const c = context?.codexAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.codexAccount : null);
  const cl = context?.claudeAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.claudeAccount : null);
  const eng = context?.engineSettings || context || {};
  const hasClaudeKey = Boolean(eng.customApiKey?.startsWith?.('sk-ant') || eng.claudeApiKey);
  const hasOpenAiKey = Boolean(eng.customApiKey?.startsWith?.('sk-') && !hasClaudeKey);
  const hasGeminiKey = Boolean(eng.customApiKey?.startsWith?.('AIza') || eng.apiKey?.startsWith?.('AIza'));

  return [
    { id: 'antigravity', ...PACKAGE_DEFINITIONS.antigravity, connected: Boolean(g?.connected) },
    { id: 'codex', ...PACKAGE_DEFINITIONS.codex, connected: Boolean(c?.connected || hasOpenAiKey) },
    { id: 'claudecode', ...PACKAGE_DEFINITIONS.claudecode, connected: Boolean(cl?.connected || hasClaudeKey) },
    { id: 'gemini', ...PACKAGE_DEFINITIONS.gemini, connected: hasGeminiKey || Boolean(g?.connected) },
    { id: 'ollama', ...PACKAGE_DEFINITIONS.ollama, connected: Boolean(context?.ollamaStatus?.connected) }
  ];
};

export const getPackageAwareModelOptions = (context?: any): SubagentModelOption[] => {
  const packages = detectConnectedPackages(context);
  const anyConnected = packages.some((p) => p.connected);
  const g = context?.googleAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.googleAccount : null);
  const c = context?.codexAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.codexAccount : null);
  const cl = context?.claudeAccount || (typeof window !== 'undefined' ? (window as any).__AGY_STORE__?.claudeAccount : null);

  const options: SubagentModelOption[] = [
    {
      id: 'auto-smart-router',
      label: '🎯 Auto (Smart Router Across Connected Providers)',
      packageId: 'auto',
      packageName: 'Auto-Router',
      connected: anyConnected
    }
  ];

  for (const pkg of packages) {
    let list: Array<{ id: string; name: string }> = [];
    if (pkg.id === 'codex' && Array.isArray(c?.models) && c.models.length > 0) {
      list = c.models;
    } else if (pkg.id === 'antigravity' && Array.isArray(g?.models) && g.models.length > 0) {
      list = g.models;
    } else if (pkg.id === 'claudecode' && Array.isArray(cl?.models) && cl.models.length > 0) {
      list = cl.models;
    } else {
      list = CATALOG_MODELS[pkg.id] || [];
    }

    for (const m of list) {
      const statusIcon = pkg.connected ? '🟢' : '⚪';
      const statusSuffix = pkg.connected ? '' : ' (Requires Account Login / API Key)';
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
