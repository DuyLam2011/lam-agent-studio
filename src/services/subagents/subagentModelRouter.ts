import { SubagentPersona } from '../../types/subagents';
import { detectConnectedPackages, inferPackageMeta } from './subagentPackageResolver';

export type IntelligenceTier = 'frontier' | 'balanced' | 'rapid';

export interface ModelRoutingDecision {
  modelId: string;
  modelName: string;
  provider: string;
  packageName: string;
  packageBadge: string;
  packageConnected: boolean;
  tier: IntelligenceTier;
  reasoningEffort: 'off' | 'low' | 'medium' | 'high';
  routingReason: string;
  temperature: number;
}

const TIER_MODELS: Record<string, Record<IntelligenceTier, { id: string; name: string }>> = {
  gemini: {
    frontier: { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Frontier)' },
    balanced: { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Balanced)' },
    rapid: { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite (Rapid)' },
  },
  codex: {
    frontier: { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol (Flagship Coding)' },
    balanced: { id: 'gpt-6-sol', name: 'GPT-6 Sol (Balanced Agent)' },
    rapid: { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra (Fast & Compact)' },
  },
  antigravity: {
    frontier: { id: 'gemini-3.8-flash-high', name: 'Gemini 3.8 Flash (High Reasoning)' },
    balanced: { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash (Medium)' },
    rapid: { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash (Fast)' },
  },
  claudecode: {
    frontier: { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Thinking)' },
    balanced: { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    rapid: { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Fast)' },
  },
  anthropic: {
    frontier: { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Think)' },
    balanced: { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Balanced)' },
    rapid: { id: 'gemini-3.5-flash-lite', name: 'Flash Lite (Rapid)' },
  },
  deepseek: {
    frontier: { id: 'deepseek-r1', name: 'DeepSeek R1 (Deep Reasoning)' },
    balanced: { id: 'deepseek-v3', name: 'DeepSeek V3 (Balanced)' },
    rapid: { id: 'deepseek-v3', name: 'DeepSeek V3 (Rapid)' },
  },
  openai: {
    frontier: { id: 'gpt-4o', name: 'GPT-4o (Frontier)' },
    balanced: { id: 'gpt-4o', name: 'GPT-4o (Balanced)' },
    rapid: { id: 'gemini-3.5-flash-lite', name: 'Flash Lite (Rapid)' },
  },
  local: {
    frontier: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' },
    balanced: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' },
    rapid: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' },
  }
};

export const evaluateTaskComplexity = (subagent: SubagentPersona, task: string): { tier: IntelligenceTier; reason: string } => {
  const t = (task || '').toLowerCase();
  const s = `${subagent.role} ${subagent.name}`.toLowerCase();
  if (/security|owasp|vulnerab|crypto|auth|injection|pentest|redteam|exploit/i.test(t)) return { tier: 'frontier', reason: 'Security audit requires Frontier reasoning.' };
  if (/architect|refactor|distributed|concurrency|race condition|multi-file/i.test(t)) return { tier: 'frontier', reason: 'Architectural decomposition requires Frontier capacity.' };
  if (/log\b|stack trace|ansi|lint|format|syntax|clean working tree/i.test(t)) return { tier: 'rapid', reason: 'Log analysis optimal for high-speed rapid execution.' };
  if (/security|redteam|pentest/i.test(s)) return { tier: 'frontier', reason: 'Security specialist default reasoning tier.' };
  if (/log|diagnost/i.test(s)) return { tier: 'rapid', reason: 'Diagnostic specialist rapid execution tier.' };
  return { tier: 'balanced', reason: 'Standard code implementation and validation.' };
};

export const resolveSubagentModel = (
  subagent: SubagentPersona,
  taskDescription: string,
  engineSettings: any = {}
): ModelRoutingDecision => {
  const { tier, reason } = evaluateTaskComplexity(subagent, taskDescription);
  const connectedPackages = detectConnectedPackages(engineSettings);
  const connectedIds = connectedPackages.filter((p) => p.connected).map((p) => p.id);

  let targetModelId = '';
  let targetModelName = '';
  let targetProvider = (engineSettings?.provider || 'antigravity').toLowerCase();

  if (subagent.model && subagent.model !== 'auto' && subagent.model !== 'auto-smart-router') {
    const meta = inferPackageMeta(subagent.model, engineSettings?.provider);
    targetModelId = subagent.model;
    targetModelName = subagent.model;
    targetProvider = meta.id;
  } else {
    const isAuto = targetProvider === 'auto' || targetProvider === 'auto-router' || targetProvider === 'auto-smart-router';
    const activePool = isAuto ? connectedIds : [targetProvider];
    const candidateProviders = activePool.filter((id) => TIER_MODELS[id]);
    const pool = candidateProviders.length > 0 ? candidateProviders : ['antigravity', 'gemini'];

    let chosenProv = pool[0];
    if (tier === 'frontier') {
      if (/viết code|sửa code|code|executor|implement/i.test(taskDescription) && pool.includes('codex')) chosenProv = 'codex';
      else if (pool.includes('antigravity')) chosenProv = 'antigravity';
      else if (pool.includes('claudecode')) chosenProv = 'claudecode';
    } else if (tier === 'rapid') {
      chosenProv = pool.includes('antigravity') ? 'antigravity' : (pool.includes('gemini') ? 'gemini' : pool[0]);
    } else {
      chosenProv = pool.includes('antigravity') ? 'antigravity' : (pool.includes('codex') ? 'codex' : pool[0]);
    }

    const providerModels = TIER_MODELS[chosenProv] || TIER_MODELS.antigravity || TIER_MODELS.gemini;
    const target = providerModels[tier] || providerModels.balanced;
    targetModelId = target.id;
    targetModelName = target.name;
    targetProvider = chosenProv;
  }

  const packageMeta = inferPackageMeta(targetModelId, targetProvider);
  const isConnected = connectedPackages.some((p) => p.id === targetProvider && p.connected);
  const reasoningMap: Record<IntelligenceTier, 'low' | 'medium' | 'high'> = { frontier: 'high', balanced: 'medium', rapid: 'low' };
  const tempMap: Record<IntelligenceTier, number> = { frontier: 0.1, balanced: 0.2, rapid: 0.15 };

  return {
    modelId: targetModelId, modelName: targetModelName, provider: targetProvider,
    packageName: packageMeta.name, packageBadge: packageMeta.badge, packageConnected: isConnected,
    tier, reasoningEffort: reasoningMap[tier], routingReason: `${reason} ${packageMeta.badge}`, temperature: tempMap[tier]
  };
};
