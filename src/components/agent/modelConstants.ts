export interface VerifiedModelItem {
  id: string;
  name: string;
  provider: string;
  badge: string;
}

export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  antigravity: 'gemini-3.8-flash-high',
  gemini: 'gemini-2.5-flash',
  claudecode: 'claude-3-7-sonnet',
  anthropic: 'claude-3-7-sonnet',
  codex: 'gpt-6.2-sol',
  openai: 'gpt-6.2-sol',
  deepseek: 'deepseek-chat',
  ollama: 'qwen2.5-coder'
};

export const DEFAULT_ANTIGRAVITY_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google Antigravity', badge: '🎯 Complexity Routing' },
  { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High)', provider: 'Google Antigravity', badge: '🧠 High Reasoning & Tools' },
  { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium)', provider: 'Google Antigravity', badge: '⚡ Balanced Performance' },
  { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low)', provider: 'Google Antigravity', badge: '🚀 Low Latency' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic via Antigravity', badge: '💡 Extended Thinking' },
  { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6', provider: 'Anthropic via Antigravity', badge: '🔬 Deep Thinking' },
  { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B', provider: 'Google Antigravity', badge: '📦 Open Weights' }
];

export const DEFAULT_CODEX_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'OpenAI Codex', badge: '🎯 Complexity Routing' },
  { id: 'gpt-6.2-sol', name: 'GPT-6.2-Sol', provider: 'OpenAI Codex', badge: '⚡ Coding & Everyday Work' },
  { id: 'gpt-6.2-astra', name: 'GPT-6.2-Astra', provider: 'OpenAI Codex', badge: '🧠 Frontier Complex Reasoning' },
  { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra', provider: 'OpenAI Codex', badge: '👁️ Vision & Computer Use' },
  { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol', provider: 'OpenAI Codex', badge: '🚀 Everyday Work (Stable)' },
  { id: 'gpt-6-astra', name: 'GPT-6-Astra', provider: 'OpenAI Codex', badge: '🔬 Deep Architecture & Coding' },
  { id: 'gpt-6-sol', name: 'GPT-6-Sol', provider: 'OpenAI Codex', badge: '📦 Balanced Legacy' },
  { id: 'gpt-6-luna', name: 'GPT-6-Luna', provider: 'OpenAI Codex', badge: '⚡ Fast & Affordable' }
];

export const DEFAULT_CLAUDECODE_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Claude Code', badge: '🎯 Complexity Routing' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'Claude Code', badge: '🧠 Frontier Coding (1M Context)' },
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', provider: 'Claude Code', badge: '🔬 Deep Analytical Reasoning (1M Context)' },
  { id: 'claude-fable-5-2', name: 'Claude Fable 5.2', provider: 'Claude Code', badge: '⚡ Autonomous Agent Workflows' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Claude Code', badge: '💡 Hybrid Reasoning & Thinking' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Claude Code', badge: '🎯 Frontier Coding Precision' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Claude Code', badge: '⚡ Lightning Fast (0.8s)' }
];

export const DEFAULT_VERIFIED_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google Gemini', badge: '🎯 Task Complexity Router' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google Gemini', badge: '⚡ Frontier Fast (0.8s)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google Gemini', badge: '🧠 Advanced Reasoning' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google Gemini', badge: '🚀 Next-Gen Multimodal' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google Gemini', badge: '📦 Lightweight' }
];

export const isModelValidForProvider = (provider: string, modelId?: string): boolean => {
  if (!modelId || modelId === 'auto-smart-router' || modelId === 'auto') return true;
  const prov = (provider || 'gemini').toLowerCase();
  if (prov === 'antigravity') {
    return DEFAULT_ANTIGRAVITY_MODELS.some((m) => m.id === modelId) || /^gemini|^claude/i.test(modelId);
  }
  if (prov === 'codex' || prov === 'openai') {
    return DEFAULT_CODEX_MODELS.some((m) => m.id === modelId) || /^gpt-4|^o[13]/i.test(modelId);
  }
  if (prov === 'claudecode' || prov === 'anthropic') {
    return DEFAULT_CLAUDECODE_MODELS.some((m) => m.id === modelId) || /^claude/i.test(modelId);
  }
  if (prov === 'gemini') {
    return DEFAULT_VERIFIED_MODELS.some((m) => m.id === modelId) || /^gemini/i.test(modelId);
  }
  if (prov === 'deepseek') return modelId.includes('deepseek');
  if (prov === 'ollama') return true;
  return true;
};
