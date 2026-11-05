export interface VerifiedModelItem {
  id: string;
  name: string;
  provider: string;
  badge: string;
}

export const DEFAULT_ANTIGRAVITY_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google Antigravity', badge: '🎯 Complexity Routing' },
  { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High)', provider: 'Google Antigravity', badge: '🧠 High Reasoning' },
  { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium)', provider: 'Google Antigravity', badge: '⚡ Balanced' },
  { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low)', provider: 'Google Antigravity', badge: '⚡ Ultra Fast' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic via Antigravity', badge: '💡 Thinking 4.6' },
  { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6', provider: 'Anthropic via Antigravity', badge: '🏆 Deep Frontier' },
  { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B', provider: 'Open Source', badge: '🌐 120B Model' }
];

export const DEFAULT_CODEX_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'OpenAI Codex', badge: '🎯 Complexity Routing' },
  { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol', provider: 'OpenAI Codex', badge: '🧠 Flagship Sol' },
  { id: 'gpt-6-astra', name: 'GPT-6 Astra', provider: 'OpenAI Codex', badge: '🔬 Deep Math/Logic' },
  { id: 'gpt-6-sol', name: 'GPT-6 Sol', provider: 'OpenAI Codex', badge: '⚡ Frontier Coding' },
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'OpenAI Codex', badge: '🚀 Fast Balanced' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'OpenAI Codex', badge: '📦 Compact' }
];

export const DEFAULT_CLAUDECODE_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Claude Code', badge: '🎯 Complexity Routing' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Claude Code', badge: '🧠 Hybrid Thinking' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Claude Code', badge: '⚡ High Precision' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Claude Code', badge: '🚀 Ultra Fast' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Claude Code', badge: '🏆 Deep Frontier' }
];

export const DEFAULT_VERIFIED_MODELS: VerifiedModelItem[] = [
  { id: 'auto-smart-router', name: 'Auto (Smart Router)', provider: 'Google', badge: '🎯 Task Complexity Router' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', provider: 'Google', badge: '⚡ Ultra Fast (0.8s)' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', provider: 'Google', badge: '⚡ Fast (0.9s)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'Google', badge: 'Deep Reasoning (~60s)' }
];
