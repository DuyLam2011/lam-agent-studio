import React from 'react';
import { Crown, SlidersHorizontal, Cloud } from 'lucide-react';
import { AgentProfileConfig } from '../../../types/agent-profile';
import { COST_BALANCE_CONFIGS, INTELLIGENCE_TIER_CONFIGS } from '../../../services/agent-profile/agentProfileDefaults';
import clsx from 'clsx';

interface FatherAgentProfileCardProps {
  profile: AgentProfileConfig;
  onOpenTune: () => void;
  onExportCloud: () => void;
}

export const FatherAgentProfileCard: React.FC<FatherAgentProfileCardProps> = ({ profile, onOpenTune, onExportCloud }) => {
  const tierMeta = INTELLIGENCE_TIER_CONFIGS[profile.intelligenceTier] || INTELLIGENCE_TIER_CONFIGS['frontier-pro'];
  const costMeta = COST_BALANCE_CONFIGS[profile.costBalance] || COST_BALANCE_CONFIGS['balanced'];

  return (
    <div className="p-4 rounded-2xl surface-card border border-amber-500/30 shadow-xl flex flex-col gap-3 select-none transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Crown size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-app-text tracking-wide">{profile.name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Agent Cha (Master Brain)
              </span>
              <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-mono border", tierMeta.badgeColor)}>
                {tierMeta.label}
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Bộ não chỉ huy tối cao: Giám sát toàn bộ Subagent Swarm, tổng hợp quyết định và phê duyệt mã nguồn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportCloud}
            className="px-2.5 py-1.5 rounded-xl surface-card hover:bg-primary/10 text-secondary hover:text-app-text border border-subtle text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Xuất Profile định dạng Cloud Database"
          >
            <Cloud size={12} />
            <span className="hidden sm:inline">Cloud JSON</span>
          </button>
          <button
            type="button"
            onClick={onOpenTune}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            <span>Cấu Hình Profile</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-subtle text-[11px] font-mono">
        <div className="p-2 rounded-xl surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase font-sans">Nỗ lực suy luận:</span>
          <span className="text-amber-400 font-bold uppercase">{profile.reasoningEffort} effort</span>
        </div>
        <div className="p-2 rounded-xl surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase font-sans">Nhiệt độ (Temp):</span>
          <span className="text-cyan-400 font-bold">{profile.temperature.toFixed(2)} (Chuẩn code)</span>
        </div>
        <div className="p-2 rounded-xl surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase font-sans">Cân bằng chi phí:</span>
          <span className={clsx("font-bold truncate", costMeta.color)}>{costMeta.label.split(' ')[0]} ({costMeta.tokenMultiplier})</span>
        </div>
        <div className="p-2 rounded-xl surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase font-sans">Model ID:</span>
          <span className="text-app-text font-bold truncate">{profile.modelId}</span>
        </div>
      </div>
    </div>
  );
};
