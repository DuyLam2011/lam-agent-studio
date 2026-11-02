import { AgentProfileConfig, CostBalanceMeta, CostBalanceMode, IntelligenceTier, IntelligenceTierMeta } from '../../types/agent-profile';

export const INTELLIGENCE_TIER_CONFIGS: Record<IntelligenceTier, IntelligenceTierMeta> = {
  'flash-fast': {
    tier: 'flash-fast',
    label: 'Flash Fast (Siêu Nhanh)',
    description: 'Tốc độ phản hồi cực cao, tối ưu tác vụ tra cứu & giải thích nhẹ.',
    defaultModel: 'gemini-2.5-flash',
    recommendedCostBalance: 'cost-optimized',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  'standard': {
    tier: 'standard',
    label: 'Standard (Tiêu Chuẩn)',
    description: 'Cân bằng giữa tốc độ và độ chính xác lập trình.',
    defaultModel: 'gemini-2.5-flash',
    recommendedCostBalance: 'balanced',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  },
  'advanced': {
    tier: 'advanced',
    label: 'Advanced (Chuyên Sâu)',
    description: 'Khả năng tư duy logic và giải quyết lỗi kỹ thuật phức tạp.',
    defaultModel: 'gemini-2.5-pro',
    recommendedCostBalance: 'high-throughput',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  'frontier-pro': {
    tier: 'frontier-pro',
    label: 'Frontier Pro (Trí Tuệ Đỉnh Cao)',
    description: 'Mô hình lập luận cao cấp nhất cho thiết kế kiến trúc và bảo mật.',
    defaultModel: 'claude-3-5-sonnet',
    recommendedCostBalance: 'frontier-intelligence',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  }
};

export const COST_BALANCE_CONFIGS: Record<CostBalanceMode, CostBalanceMeta> = {
  'cost-optimized': {
    mode: 'cost-optimized',
    label: 'Tiết Kiệm Chi Phí (Budget Saver)',
    sublabel: 'Cắt giảm ~80% token, hạn chế nỗ lực tư duy dài',
    tokenMultiplier: '0.2x',
    color: 'text-emerald-400'
  },
  'balanced': {
    mode: 'balanced',
    label: 'Cân Bằng Chuẩn (Balanced)',
    sublabel: 'Tối ưu giữa chi phí token và chất lượng code',
    tokenMultiplier: '1.0x',
    color: 'text-blue-400'
  },
  'high-throughput': {
    mode: 'high-throughput',
    label: 'Hiệu Năng Cao (High Throughput)',
    sublabel: 'Ưu tiên phản hồi đầy đủ và nỗ lực suy luận sâu',
    tokenMultiplier: '1.8x',
    color: 'text-purple-400'
  },
  'frontier-intelligence': {
    mode: 'frontier-intelligence',
    label: 'Tối Đa Trí Tuệ (Max Intelligence)',
    sublabel: 'Không giới hạn tài nguyên cho các bài toán cực khó',
    tokenMultiplier: '3.0x',
    color: 'text-amber-400'
  }
};

export const createDefaultFatherAgentProfile = (): AgentProfileConfig => ({
  id: 'profile-father-agent',
  agentId: 'father-agent',
  name: 'Father Agent',
  role: 'Bộ Não Chỉ Huy & Điều Phối Tối Cao',
  isFatherAgent: true,
  reasoningEffort: 'high',
  temperature: 0.1,
  costBalance: 'balanced',
  intelligenceTier: 'frontier-pro',
  modelId: 'gemini-2.5-pro',
  maxOutputTokens: 8192,
  autoApproveTools: false,
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
