import { calculateTaskComplexity, TaskComplexityReport, TaskComplexityTier } from './taskComplexityCalculator';

export interface SmartRoutingDecision {
  modelId: string;
  modelName: string;
  provider: string;
  complexity: TaskComplexityReport;
  reasoningEffort: 'low' | 'medium' | 'high';
  temperature: number;
  thinkingDirective: string;
}

const PROVIDER_TIER_MODELS: Record<string, Record<TaskComplexityTier, { id: string; name: string }>> = {
  claudecode: {
    L1_RAPID: { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku (Rapid)' },
    L2_BALANCED: { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Balanced)' },
    L3_COMPLEX: { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Think)' },
    L4_FRONTIER: { id: 'claude-3-opus', name: 'Claude 3 Opus (Deep Frontier)' }
  },
  codex: {
    L1_RAPID: { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra (Rapid)' },
    L2_BALANCED: { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol (Balanced Fast)' },
    L3_COMPLEX: { id: 'gpt-6-sol', name: 'GPT-6 Sol (Frontier Coding)' },
    L4_FRONTIER: { id: 'gpt-6.1-sol', name: 'GPT-6.1-Sol (Flagship Reasoning)' }
  },
  antigravity: {
    L1_RAPID: { id: 'gemini-3.8-flash-low', name: 'Gemini 3.8 Flash Low (Rapid)' },
    L2_BALANCED: { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash Medium (Balanced)' },
    L3_COMPLEX: { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 (Thinking)' },
    L4_FRONTIER: { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6 (Deep Reasoning)' }
  },
  gemini: {
    L1_RAPID: { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite (Rapid)' },
    L2_BALANCED: { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Balanced)' },
    L3_COMPLEX: { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Frontier Reasoning)' },
    L4_FRONTIER: { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Deep Frontier)' }
  },
  anthropic: {
    L1_RAPID: { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Rapid)' },
    L2_BALANCED: { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Balanced)' },
    L3_COMPLEX: { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Hybrid Think)' },
    L4_FRONTIER: { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet (Deep Reasoning)' }
  },
  deepseek: {
    L1_RAPID: { id: 'deepseek-v3', name: 'DeepSeek V3 (Rapid)' },
    L2_BALANCED: { id: 'deepseek-v3', name: 'DeepSeek V3 (Balanced)' },
    L3_COMPLEX: { id: 'deepseek-r1', name: 'DeepSeek R1 (Reasoning King)' },
    L4_FRONTIER: { id: 'deepseek-r1', name: 'DeepSeek R1 (Deep Math/Logic)' }
  },
  openai: {
    L1_RAPID: { id: 'gpt-4o', name: 'GPT-4o (Rapid)' },
    L2_BALANCED: { id: 'gpt-4o', name: 'GPT-4o (Balanced)' },
    L3_COMPLEX: { id: 'gpt-4o', name: 'GPT-4o (Frontier)' },
    L4_FRONTIER: { id: 'gpt-4o', name: 'GPT-4o (Frontier High)' }
  },
  local: {
    L1_RAPID: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' },
    L2_BALANCED: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' },
    L3_COMPLEX: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' },
    L4_FRONTIER: { id: 'local-ollama', name: 'Ollama Qwen2.5-Coder' }
  }
};

export const resolveSmartModelRoute = (params: {
  userPrompt: string;
  contextAttachments?: any[];
  activeFilePath?: string;
  engineSettings: any;
  subagentRole?: string;
}): SmartRoutingDecision => {
  const { userPrompt, contextAttachments, activeFilePath, engineSettings = {}, subagentRole } = params;
  const complexity = calculateTaskComplexity({
    taskText: userPrompt,
    contextAttachments,
    activeFilePath,
    subagentRole
  });

  const provider = (engineSettings.provider || 'gemini').toLowerCase();
  const models = PROVIDER_TIER_MODELS[provider] || PROVIDER_TIER_MODELS.gemini;
  const isAutoMode = !engineSettings.selectedModel ||
    engineSettings.selectedModel === 'auto-smart-router' ||
    engineSettings.selectedModel === 'auto';

  const chosenTarget = isAutoMode
    ? models[complexity.tier]
    : { id: engineSettings.selectedModel, name: engineSettings.selectedModel };

  const tempMap: Record<TaskComplexityTier, number> = {
    L1_RAPID: 0.15,
    L2_BALANCED: 0.2,
    L3_COMPLEX: 0.1,
    L4_FRONTIER: 0.05
  };

  const thinkingDirective = [
    `[TASK_COMPLEXITY_ROUTER: ${complexity.score}/100 · ${complexity.tier}]`,
    `• Dimensions: Scope=${complexity.dimensions.scopeScale}/25 | Security=${complexity.dimensions.securityCriticality}/25 | Architecture=${complexity.dimensions.architecturalDepth}/25 | Cognitive=${complexity.dimensions.cognitiveDifficulty}/25`,
    `• Active Model Engine: ${chosenTarget.name} (${chosenTarget.id})`,
    `• Reasoning Effort: ${complexity.recommendedReasoningEffort.toUpperCase()} | Output Profile: ${complexity.recommendedOutputMode}`
  ].join('\n');

  return {
    modelId: chosenTarget.id,
    modelName: chosenTarget.name,
    provider,
    complexity,
    reasoningEffort: complexity.recommendedReasoningEffort,
    temperature: tempMap[complexity.tier],
    thinkingDirective
  };
};
