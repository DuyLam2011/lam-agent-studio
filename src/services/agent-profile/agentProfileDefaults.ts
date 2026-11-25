import { AgentProfileConfig, CostBalanceMeta, CostBalanceMode, IntelligenceTier, IntelligenceTierMeta } from '../../types/agent-profile';

export const INTELLIGENCE_TIER_CONFIGS: Record<IntelligenceTier, IntelligenceTierMeta> = {
  'flash-fast': {
    tier: 'flash-fast',
    label: 'Flash Fast (Ultra Velocity)',
    description: 'Sub-second response time, optimal for rapid lookups, syntax fixes & atomic edits.',
    defaultModel: 'gemini-2.5-flash',
    recommendedCostBalance: 'cost-optimized',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  'standard': {
    tier: 'standard',
    label: 'Standard (Balanced)',
    description: 'Balanced latency and coding accuracy for everyday software engineering.',
    defaultModel: 'gemini-2.5-flash',
    recommendedCostBalance: 'balanced',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  },
  'advanced': {
    tier: 'advanced',
    label: 'Advanced (Deep Logic)',
    description: 'High reasoning depth for intricate algorithms, refactoring & complex bugs.',
    defaultModel: 'gemini-2.5-pro',
    recommendedCostBalance: 'high-throughput',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  'frontier-pro': {
    tier: 'frontier-pro',
    label: 'Frontier Pro (Peak Intelligence)',
    description: 'State-of-the-art model reasoning for system architecture, OWASP security & swarms.',
    defaultModel: 'claude-3-5-sonnet',
    recommendedCostBalance: 'frontier-intelligence',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  }
};

export const COST_BALANCE_CONFIGS: Record<CostBalanceMode, CostBalanceMeta> = {
  'cost-optimized': {
    mode: 'cost-optimized',
    label: 'Budget Saver (0.2x)',
    sublabel: 'Saves ~80% tokens, minimal thinking overhead',
    tokenMultiplier: '0.2x',
    color: 'text-emerald-400'
  },
  'balanced': {
    mode: 'balanced',
    label: 'Standard Balanced (1.0x)',
    sublabel: 'Optimal balance between token budget and code quality',
    tokenMultiplier: '1.0x',
    color: 'text-blue-400'
  },
  'high-throughput': {
    mode: 'high-throughput',
    label: 'High Throughput (1.8x)',
    sublabel: 'Extended thinking budget and thorough multi-pass context',
    tokenMultiplier: '1.8x',
    color: 'text-purple-400'
  },
  'frontier-intelligence': {
    mode: 'frontier-intelligence',
    label: 'Max Intelligence (3.0x)',
    sublabel: 'Unbounded context & reasoning tokens for mission-critical tasks',
    tokenMultiplier: '3.0x',
    color: 'text-amber-400'
  }
};

export const createDefaultFatherAgentProfile = (): AgentProfileConfig => ({
  id: 'profile-father-agent',
  agentId: 'father-agent',
  name: 'Father Agent',
  role: 'Omniscient Orchestrator & Delegator',
  isFatherAgent: true,
  reasoningEffort: 'high',
  temperature: 0.2,
  costBalance: 'balanced',
  intelligenceTier: 'frontier-pro',
  modelId: 'auto-smart-router',
  maxOutputTokens: 8192,
  autoApproveTools: true,
  updatedAt: Date.now(),
  cloudSyncStatus: 'local'
});

export const createDefaultSubagentProfile = (subagent: { id: string; name: string; role: string }): AgentProfileConfig => ({
  id: `profile-${subagent.id}`,
  agentId: subagent.id,
  name: subagent.name,
  role: subagent.role,
  isFatherAgent: false,
  reasoningEffort: 'medium',
  temperature: 0.2,
  costBalance: 'balanced',
  intelligenceTier: 'standard',
  modelId: 'gemini-2.5-flash',
  maxOutputTokens: 4096,
  autoApproveTools: true,
  updatedAt: Date.now(),
  cloudSyncStatus: 'local'
});
