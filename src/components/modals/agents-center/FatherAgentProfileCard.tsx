import React from 'react';
import { Crown, Cloud, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { AgentProfileConfig } from '../../../types/agent-profile';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface FatherAgentProfileCardProps {
  profile: AgentProfileConfig;
  onExportCloud: () => void;
}

export const FatherAgentProfileCard: React.FC<FatherAgentProfileCardProps> = ({ profile, onExportCloud }) => {
  const { setAgentsCenterTab, engineSettings } = useAgentStore();
  const currentModel = engineSettings.selectedModel || profile.modelId || 'auto-smart-router';
  const isUnified = (engineSettings.executionStrategy || 'unified_chat_ai') === 'unified_chat_ai';
  const codingTarget = isUnified
    ? `Direct Chat AI (${engineSettings.codingModel || currentModel})`
    : (engineSettings.codingModel || engineSettings.pairedCodingAgent || 'codex').toUpperCase();
  const isAuto = engineSettings.delegationMode === 'auto_dispatch';

  return (
    <div className="p-4 rounded-2xl surface-card border border-subtle shadow-sm flex flex-col gap-3 select-none transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
            <Crown size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-app-text tracking-wide">{profile.name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-semibold bg-primary/10 text-primary border border-primary/25">
                Master Orchestrator
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Understands project context, clarifies requirements, and coordinates coding directly or via specialized workers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAgentsCenterTab('father')}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Open unified Father Agent configuration"
          >
            <SlidersHorizontal size={12} />
            <span>Configure Father Agent</span>
          </button>
          <button
            type="button"
            onClick={onExportCloud}
            className="p-1.5 rounded-xl surface-input hover:bg-primary/10 text-secondary hover:text-app-text border border-subtle text-xs transition-colors cursor-pointer"
            title="Export profile JSON"
          >
            <Cloud size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-subtle text-[10.5px] font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted font-sans text-[10px]">Pipeline:</span>
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold truncate max-w-[180px]">
            {currentModel}
          </span>
          <ArrowRight size={10} className="text-muted" />
          <span className="px-2 py-0.5 rounded-md surface-input text-app-text border border-subtle font-semibold truncate max-w-[200px]">
            {codingTarget}
          </span>
        </div>

        <span className={clsx(
          'px-2 py-0.5 rounded-md border text-[9.5px]',
          isAuto ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        )}>
          {isAuto ? 'Auto-Dispatch' : 'Interactive Gate'}
        </span>
      </div>
    </div>
  );
};

export default FatherAgentProfileCard;
