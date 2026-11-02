import React from 'react';
import { Brain, DollarSign } from 'lucide-react';
import { AgentProfileConfig, CostBalanceMode, IntelligenceTier } from '../../../../types/agent-profile';
import { COST_BALANCE_CONFIGS, INTELLIGENCE_TIER_CONFIGS } from '../../../../services/agent-profile/agentProfileDefaults';
import clsx from 'clsx';

interface ProfileIntelligenceSectionProps {
  formData: AgentProfileConfig;
  onChange: (patch: Partial<AgentProfileConfig>) => void;
}

export const ProfileIntelligenceSection: React.FC<ProfileIntelligenceSectionProps> = ({ formData, onChange }) => {
  return (
    <div className="space-y-4">
      {/* Intelligence Tier */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-app-text flex items-center gap-1.5">
          <Brain size={13} className="text-primary" /> Cấp Bậc Trí Tuệ (Intelligence Tier)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(INTELLIGENCE_TIER_CONFIGS) as IntelligenceTier[]).map((tierKey) => {
            const tierMeta = INTELLIGENCE_TIER_CONFIGS[tierKey];
            const isSelected = formData.intelligenceTier === tierKey;
            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => onChange({ intelligenceTier: tierKey, modelId: tierMeta.defaultModel, costBalance: tierMeta.recommendedCostBalance })}
                className={clsx(
                  "surface-card p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1",
                  isSelected ? "border-primary bg-primary/15 text-primary shadow-sm" : "border-subtle text-secondary hover:text-app-text hover:border-primary/40"
                )}
              >
                <span className="font-semibold text-xs text-app-text">{tierMeta.label}</span>
                <span className="text-[10px] text-muted line-clamp-2 leading-relaxed">{tierMeta.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cost Balance Preset */}
      <div className="space-y-1.5 pt-2 border-t border-subtle">
        <label className="text-[11px] font-semibold text-app-text flex items-center gap-1.5">
          <DollarSign size={13} className="text-emerald-400" /> Cân Bằng Chi Phí (Cost & Efficiency Balance)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(COST_BALANCE_CONFIGS) as CostBalanceMode[]).map((modeKey) => {
            const costMeta = COST_BALANCE_CONFIGS[modeKey];
            const isSelected = formData.costBalance === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => onChange({ costBalance: modeKey })}
                className={clsx(
                  "surface-card p-2 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm" : "border-subtle text-secondary hover:text-app-text hover:border-emerald-500/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-app-text">{costMeta.label}</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">{costMeta.tokenMultiplier}</span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">{costMeta.sublabel}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
