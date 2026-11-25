export interface ConnectedPackageInfo {
  id: string;
  name: string;
  badge: string;
  connected: boolean;
  colorClass: string;
}

export type ModelRoleTag = 'Router' | 'Chat & Coding' | 'Coding' | 'Reasoning' | 'Local';

export interface SubagentModelOption {
  id: string;
  label: string;
  packageId: string;
  packageName: string;
  connected: boolean;
  roleTag?: ModelRoleTag;
  description?: string;
}

export const PACKAGE_DEFINITIONS: Record<string, { name: string; badge: string; colorClass: string }> = {
  antigravity: { name: 'Google Antigravity', badge: '[Package: Google Antigravity]', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  openai: { name: 'OpenAI Chat & API', badge: '[Package: OpenAI Chat]', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  codex: { name: 'OpenAI Codex', badge: '[Package: OpenAI Codex]', colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  claudecode: { name: 'Anthropic Claude', badge: '[Package: Claude]', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  gemini: { name: 'Google Gemini API', badge: '[Package: Google Gemini API]', colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  deepseek: { name: 'DeepSeek AI', badge: '[Package: DeepSeek]', colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  ollama: { name: 'Local Ollama', badge: '[Package: Local Ollama]', colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }
};

export const CATALOG_MODELS: Record<string, Array<{ id: string; name: string; roleTag?: ModelRoleTag }>> = {
  antigravity: [
    { id: 'argon', name: 'Argon (Frontier Experimental Reasoning - 2M Context)', roleTag: 'Reasoning' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Frontier Chat & Architecture)', roleTag: 'Chat & Coding' },
    { id: 'gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking Exp', roleTag: 'Reasoning' },
    { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High Reasoning & Tools)', roleTag: 'Chat & Coding' },
    { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Balanced)', roleTag: 'Chat & Coding' },
    { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Low Latency)', roleTag: 'Chat & Coding' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Thinking)', roleTag: 'Chat & Coding' },
    { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6 (Deep Thinking)', roleTag: 'Reasoning' },
    { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B (Open Weights)', roleTag: 'Chat & Coding' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'ChatGPT-4o (Omniscient Chat & Coding)', roleTag: 'Chat & Coding' },
    { id: 'gpt-4.1', name: 'GPT-4.1 (Long Context & Direct Coding)', roleTag: 'Chat & Coding' },
    { id: 'o3-mini', name: 'OpenAI o3-mini (Frontier Reasoning)', roleTag: 'Reasoning' },
    { id: 'o1', name: 'OpenAI o1 (Deep Analytical Reasoning)', roleTag: 'Reasoning' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast Everyday Assistant)', roleTag: 'Chat & Coding' }
  ],
  codex: [
    { id: 'o3-mini', name: 'OpenAI o3-mini (Frontier Reasoning)', roleTag: 'Reasoning' },
    { id: 'o1', name: 'OpenAI o1 (Deep Analytical Reasoning)', roleTag: 'Reasoning' },
    { id: 'gpt-6.2-astra', name: 'GPT-6.2-Astra (Frontier Complex Reasoning)', roleTag: 'Coding' },
    { id: 'gpt-6.2-sol', name: 'GPT-6.2-Sol (Coding & Everyday Work)', roleTag: 'Coding' },
    { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra (Visual & Computer Use)', roleTag: 'Coding' },
    { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol (Everyday Work)', roleTag: 'Coding' },
    { id: 'gpt-6-astra', name: 'GPT-6-Astra (Complex Architecture)', roleTag: 'Coding' },
    { id: 'gpt-6-sol', name: 'GPT-6-Sol (Balanced Coding)', roleTag: 'Coding' },
    { id: 'gpt-6-luna', name: 'GPT-6-Luna (Fast & Affordable)', roleTag: 'Coding' }
  ],
  claudecode: [
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Chat & Coding)', roleTag: 'Chat & Coding' },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5 (Frontier Coding - 1M Context)', roleTag: 'Chat & Coding' },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8 (Deep Analytical Reasoning)', roleTag: 'Reasoning' },
    { id: 'claude-fable-5-2', name: 'Claude Fable 5.2 (Autonomous Workflows)', roleTag: 'Coding' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Precision Coding)', roleTag: 'Chat & Coding' },
    { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Lightning Fast)', roleTag: 'Chat & Coding' }
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Frontier Chat & Coding)', roleTag: 'Chat & Coding' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Frontier Fast)', roleTag: 'Chat & Coding' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Rapid Multimodal)', roleTag: 'Chat & Coding' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Lightweight)', roleTag: 'Chat & Coding' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3 Chat (Direct Chat & Coding)', roleTag: 'Chat & Coding' },
    { id: 'deepseek-r1', name: 'DeepSeek R1 (Deep Reasoning)', roleTag: 'Reasoning' }
  ],
  ollama: [
    { id: 'deepseek-r1', name: 'Ollama DeepSeek-R1 (Local Reasoning)', roleTag: 'Local' },
    { id: 'qwen2.5-coder', name: 'Ollama Qwen2.5-Coder (Local Coding)', roleTag: 'Local' },
    { id: 'llama3.3', name: 'Ollama Llama 3.3 (Local General Chat)', roleTag: 'Local' }
  ]
};
