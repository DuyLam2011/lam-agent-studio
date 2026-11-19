import React from 'react';
import { Bot, SlidersHorizontal, Cloud } from 'lucide-react';
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
    <div className="p-3.5 rounded-xl surface-card border border-subtle shadow-sm flex flex-col gap-2.5 select-none transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-lg surface-panel text-primary border border-subtle flex items-center justify-center shrink-0">
            <Bot size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-app-text tracking-wide">{profile.name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-medium surface-panel text-primary border border-subtle">
                Lead Coordinator
              </span>
              <span className={clsx("px-2 py-0.5 rounded-full text-[9.5px] font-mono border", tierMeta.badgeColor)}>
                {tierMeta.label}
              </span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
              Coordinates task delegation, context assembly, and code verification across subagent swarms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onExportCloud}
            className="px-2 py-1 rounded-lg surface-card hover:bg-primary/10 text-secondary hover:text-app-text border border-subtle text-[10.5px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Export profile JSON"
          >
            <Cloud size={11} />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button
            type="button"
            onClick={onOpenTune}
            className="px-3 py-1 rounded-lg surface-card hover:border-primary/40 text-app-text hover:bg-primary/10 border border-subtle text-[11px] font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal size={11} className="text-primary" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-subtle text-[10.5px] font-mono">
        <div className="px-2 py-1.5 rounded-lg surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[9.5px] text-muted uppercase font-sans">Reasoning:</span>
          <span className="text-app-text font-semibold uppercase">{profile.reasoningEffort} effort</span>
        </div>
        <div className="px-2 py-1.5 rounded-lg surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[9.5px] text-muted uppercase font-sans">Temperature:</span>
          <span className="text-cyan-400 font-semibold">{profile.temperature.toFixed(2)}</span>
        </div>
        <div className="px-2 py-1.5 rounded-lg surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[9.5px] text-muted uppercase font-sans">Token Multiplier:</span>
          <span className={clsx("font-semibold truncate", costMeta.color)}>{costMeta.label.split(' ')[0]} ({costMeta.tokenMultiplier})</span>
        </div>
        <div className="px-2 py-1.5 rounded-lg surface-input border border-subtle flex flex-col gap-0.5">
          <span className="text-[9.5px] text-muted uppercase font-sans">Active Model:</span>
          <span className="text-app-text font-semibold truncate">{profile.modelId}</span>
        </div>
      </div>
    </div>
  );
};
