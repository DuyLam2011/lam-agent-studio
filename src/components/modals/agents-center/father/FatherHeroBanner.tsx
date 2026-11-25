import React from 'react';
import { Crown, ArrowRight, Bot, KeyRound, Cloud, ExternalLink } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import clsx from 'clsx';

export const FatherHeroBanner: React.FC = () => {
  const { engineSettings, getAgentProfile, setAccountModalOpen, setOllamaModalOpen } = useAgentStore();
  const fatherProfile = getAgentProfile('father-agent');
  const currentModel = engineSettings.selectedModel || fatherProfile.modelId || 'auto-smart-router';
  const isUnified = (engineSettings.executionStrategy || 'unified_chat_ai') === 'unified_chat_ai';
  const codingTarget = isUnified
    ? `Direct (${engineSettings.codingModel || currentModel})`
    : (engineSettings.codingModel || engineSettings.pairedCodingAgent || 'codex').toUpperCase();
  const isAutoGate = engineSettings.delegationMode === 'auto_dispatch';

  return (
    <div className="surface-card p-4 rounded-2xl border border-subtle flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center shrink-0">
            <Crown size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-app-text tracking-wide">Father Agent</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                Master Orchestrator
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
              Understands project context, clarifies requirements with you, and codes directly or delegates execution to specialized workers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl surface-input hover:bg-primary/10 text-secondary hover:text-app-text border border-subtle text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound size={12} className="text-primary" />
            <span>Accounts</span>
          </button>
          <button
            type="button"
            onClick={() => setOllamaModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl surface-input hover:bg-primary/10 text-secondary hover:text-app-text border border-subtle text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cloud size={12} className="text-primary" />
            <span>API &amp; Local Hub</span>
          </button>
          <button
            type="button"
            onClick={() => window.lamApi?.fatherWindow?.open?.()}
            className="px-2.5 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink size={12} />
            <span>Father Window</span>
          </button>
        </div>
      </div>

      {/* Pipeline Preview Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-subtle text-[10.5px] font-mono">
        <span className="text-muted font-sans uppercase tracking-wider text-[10px] font-semibold">Active Flow:</span>
        <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/25 font-semibold flex items-center gap-1 truncate max-w-[200px]">
          <Bot size={11} />
          <span className="truncate">{currentModel}</span>
        </span>
        <ArrowRight size={11} className="text-muted shrink-0" />
        <span className="px-2 py-0.5 rounded-lg surface-input text-app-text border border-subtle font-semibold truncate max-w-[200px]">
          {codingTarget}
        </span>
        <span className={clsx(
          'ml-auto px-2 py-0.5 rounded-md border text-[10px]',
          isAutoGate ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        )}>
          {isAutoGate ? 'Auto-Dispatch' : 'Interactive Gate'}
        </span>
      </div>
    </div>
  );
};
