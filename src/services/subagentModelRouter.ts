import { SubagentPersona } from '../types/subagents';

export type IntelligenceTier = 'frontier' | 'balanced' | 'rapid';

export interface ModelRoutingDecision {
  modelId: string;
  modelName: string;
  provider: string;
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
  const taskLower = (task || '').toLowerCase();
  const subLower = `${subagent.role} ${subagent.name}`.toLowerCase();

  // 1. Task-driven complexity evaluation
  if (/security|owasp|vulnerab|crypto|auth|injection|pentest|redteam|exploit/i.test(taskLower)) {
    return { tier: 'frontier', reason: 'High-risk security audit & vulnerability defense requires Frontier deep reasoning.' };
  }
  if (/architect|refactor|distributed|concurrency|race condition|multi-file/i.test(taskLower)) {
    return { tier: 'frontier', reason: 'Complex architectural decomposition requires Frontier reasoning capacity.' };
  }
  if (/log\b|stack trace|ansi|lint|format|syntax|clean working tree/i.test(taskLower)) {
    return { tier: 'rapid', reason: 'Streamlined log analysis & syntax review optimal for high-speed rapid execution.' };
  }

  // 2. Persona-driven fallback for specialized domains
  if (/security|redteam|pentest/i.test(subLower)) {
    return { tier: 'frontier', reason: 'Security specialist subagent default reasoning tier.' };
  }
  if (/log|diagnost/i.test(subLower)) {
    return { tier: 'rapid', reason: 'Diagnostic & log analyst specialist rapid execution tier.' };
  }

  return { tier: 'balanced', reason: 'Standard code implementation, DOM review, and test assertions.' };
};

export const resolveSubagentModel = (
  subagent: SubagentPersona,
  taskDescription: string,
  engineSettings: any = {}
): ModelRoutingDecision => {
  const { tier, reason } = evaluateTaskComplexity(subagent, taskDescription);
  const provider = (engineSettings?.provider || 'gemini').toLowerCase();
  const providerModels = TIER_MODELS[provider] || TIER_MODELS.gemini;
  const target = providerModels[tier] || providerModels.balanced;

  const reasoningMap: Record<IntelligenceTier, 'low' | 'medium' | 'high'> = {
    frontier: 'high',
    balanced: 'medium',
    rapid: 'low'
  };

  const tempMap: Record<IntelligenceTier, number> = {
    frontier: 0.1,
    balanced: 0.2,
    rapid: 0.15
  };

  return {
    modelId: target.id,
    modelName: target.name,
    provider,
    tier,
    reasoningEffort: reasoningMap[tier],
    routingReason: reason,
    temperature: tempMap[tier]
  };
};
