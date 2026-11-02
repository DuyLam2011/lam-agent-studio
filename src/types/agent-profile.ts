export type ReasoningEffortLevel = 'low' | 'medium' | 'high' | 'max';

export type CostBalanceMode =
  | 'cost-optimized'
  | 'balanced'
  | 'high-throughput'
  | 'frontier-intelligence';

export type IntelligenceTier =
  | 'flash-fast'
  | 'standard'
  | 'advanced'
  | 'frontier-pro';

export interface AgentProfileConfig {
  id: string;
  agentId: string; // 'father-agent' or subagent.id
  userId?: string; // Sẵn sàng liên kết cơ sở dữ liệu cloud theo tài khoản người dùng
  name: string;
  role: string;
  isFatherAgent: boolean;
  reasoningEffort: ReasoningEffortLevel;
  temperature: number; // 0.0 - 1.0
  costBalance: CostBalanceMode;
  intelligenceTier: IntelligenceTier;
  modelId: string;
  maxOutputTokens: number;
  autoApproveTools: boolean;
  customSystemInstructions?: string;
  updatedAt: number;
  cloudSyncStatus: 'local' | 'synced' | 'pending_sync';
}

export interface IntelligenceTierMeta {
  tier: IntelligenceTier;
  label: string;
  description: string;
  defaultModel: string;
  recommendedCostBalance: CostBalanceMode;
  badgeColor: string;
}

export interface CostBalanceMeta {
  mode: CostBalanceMode;
  label: string;
  sublabel: string;
  tokenMultiplier: string;
  color: string;
}
