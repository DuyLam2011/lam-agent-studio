export interface VerifiedModelItem {
  id: string;
  name: string;
  provider: string;
  badge: string;
  roleTag?: 'Chat & Coding' | 'Coding' | 'Reasoning' | 'Local' | 'Router';
}

export const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  antigravity: 'argon',
  gemini: 'gemini-2.5-pro',
  claudecode: 'claude-3-7-sonnet',
  anthropic: 'claude-3-7-sonnet',
  codex: 'gpt-6.2-astra',
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
  openrouter: 'openai/gpt-4o',
  ollama: 'deepseek-r1'
};

export const DEFAULT_ANTIGRAVITY_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google Antigravity', badge: 'Complexity Routing', roleTag: 'Router' },
  { id: 'argon', name: 'Argon (Frontier Experimental Reasoning)', provider: 'Google Antigravity', badge: '2M Context Frontier', roleTag: 'Reasoning' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google Antigravity', badge: 'Frontier Chat & Coding', roleTag: 'Chat & Coding' },
  { id: 'gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking', provider: 'Google Antigravity', badge: 'High-Speed Thinking', roleTag: 'Reasoning' },
  { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High)', provider: 'Google Antigravity', badge: 'High Reasoning & Tools', roleTag: 'Chat & Coding' },
  { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Balanced)', provider: 'Google Antigravity', badge: 'Balanced Performance', roleTag: 'Chat & Coding' },
  { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low)', provider: 'Google Antigravity', badge: 'Low Latency', roleTag: 'Chat & Coding' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic via Antigravity', badge: 'Extended Thinking', roleTag: 'Chat & Coding' },
  { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6', provider: 'Anthropic via Antigravity', badge: 'Deep Thinking', roleTag: 'Reasoning' },
  { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B', provider: 'Google Antigravity', badge: 'Open Weights', roleTag: 'Chat & Coding' }
];

export const DEFAULT_OPENAI_CHAT_MODELS: VerifiedModelItem[] = [
  { id: 'gpt-4o', name: 'ChatGPT-4o (OpenAI)', provider: 'OpenAI Chat & API', badge: 'Omniscient Chat & Coding', roleTag: 'Chat & Coding' },
  { id: 'gpt-4.1', name: 'GPT-4.1 (OpenAI)', provider: 'OpenAI Chat & API', badge: '1M Context & Coding', roleTag: 'Chat & Coding' },
  { id: 'o3-mini', name: 'OpenAI o3-mini', provider: 'OpenAI Chat & API', badge: 'STEM & Logic Reasoning', roleTag: 'Reasoning' },
  { id: 'o1', name: 'OpenAI o1', provider: 'OpenAI Chat & API', badge: 'Deep Analytical Reasoning', roleTag: 'Reasoning' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI Chat & API', badge: 'Fast Lightweight Chat', roleTag: 'Chat & Coding' }
];

export const DEFAULT_CODEX_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'OpenAI Codex', badge: 'Complexity Routing', roleTag: 'Router' },
  { id: 'o3-mini', name: 'OpenAI o3-mini', provider: 'OpenAI Codex', badge: 'Frontier Reasoning', roleTag: 'Reasoning' },
  { id: 'o1', name: 'OpenAI o1', provider: 'OpenAI Codex', badge: 'Deep Reasoning', roleTag: 'Reasoning' },
  { id: 'gpt-6.2-astra', name: 'GPT-6.2-Astra', provider: 'OpenAI Codex', badge: 'Frontier Complex Reasoning', roleTag: 'Coding' },
  { id: 'gpt-6.2-sol', name: 'GPT-6.2-Sol', provider: 'OpenAI Codex', badge: 'Coding & Everyday Work', roleTag: 'Coding' },
  { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra', provider: 'OpenAI Codex', badge: 'Vision & Computer Use', roleTag: 'Coding' },
  { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol', provider: 'OpenAI Codex', badge: 'Everyday Work (Stable)', roleTag: 'Coding' },
  { id: 'gpt-6-astra', name: 'GPT-6-Astra', provider: 'OpenAI Codex', badge: 'Deep Architecture & Coding', roleTag: 'Coding' },
  { id: 'gpt-6-sol', name: 'GPT-6-Sol', provider: 'OpenAI Codex', badge: 'Balanced Coding', roleTag: 'Coding' },
  { id: 'gpt-6-luna', name: 'GPT-6-Luna', provider: 'OpenAI Codex', badge: 'Fast & Affordable', roleTag: 'Coding' }
];

export const DEFAULT_CLAUDECODE_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Claude Code', badge: 'Complexity Routing', roleTag: 'Router' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Claude Code', badge: 'Hybrid Chat & Coding', roleTag: 'Chat & Coding' },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'Claude Code', badge: 'Frontier Coding (1M Context)', roleTag: 'Chat & Coding' },
  { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', provider: 'Claude Code', badge: 'Deep Analytical Reasoning', roleTag: 'Reasoning' },
  { id: 'claude-fable-5-2', name: 'Claude Fable 5.2', provider: 'Claude Code', badge: 'Autonomous Workflows', roleTag: 'Coding' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Claude Code', badge: 'Precision Coding', roleTag: 'Chat & Coding' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Claude Code', badge: 'Lightning Fast (0.8s)', roleTag: 'Chat & Coding' }
];

export const DEFAULT_VERIFIED_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google Gemini', badge: 'Task Complexity Router', roleTag: 'Router' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google Gemini', badge: 'Frontier Chat & Coding', roleTag: 'Chat & Coding' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google Gemini', badge: 'Frontier Fast (0.8s)', roleTag: 'Chat & Coding' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google Gemini', badge: 'Next-Gen Multimodal', roleTag: 'Chat & Coding' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google Gemini', badge: 'Lightweight', roleTag: 'Chat & Coding' }
];

export const isModelValidForProvider = (provider: string, modelId?: string): boolean => {
  if (!modelId || modelId === 'auto-smart-router' || modelId === 'auto') return true;
  const prov = (provider || 'gemini').toLowerCase();
  if (prov === 'antigravity') {
    return DEFAULT_ANTIGRAVITY_MODELS.some((m) => m.id === modelId) || /^gemini|^claude|^argon|^gpt-oss/i.test(modelId);
  }
  if (prov === 'codex' || prov === 'openai') {
    return DEFAULT_CODEX_MODELS.some((m) => m.id === modelId) || DEFAULT_OPENAI_CHAT_MODELS.some((m) => m.id === modelId) || /^gpt|^o[1-9]|codex/i.test(modelId);
  }
  if (prov === 'claudecode' || prov === 'anthropic') {
    return DEFAULT_CLAUDECODE_MODELS.some((m) => m.id === modelId) || /^claude/i.test(modelId);
  }
  if (prov === 'gemini') {
    return DEFAULT_VERIFIED_MODELS.some((m) => m.id === modelId) || /^gemini|^argon/i.test(modelId);
  }
  if (prov === 'deepseek') return modelId.includes('deepseek');
  if (prov === 'openrouter' || prov === 'ollama') return true;
  return true;
};
