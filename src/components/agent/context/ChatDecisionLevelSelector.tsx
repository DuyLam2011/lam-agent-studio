import React, { useState, useRef, useEffect } from 'react';
import { Zap, Scale, Search, ShieldCheck, ChevronUp, Check, ShieldAlert } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentDecisionLevel } from '../../../types/settings-center';
import clsx from 'clsx';

interface DecisionOptionItem {
  id: AgentDecisionLevel;
  label: string;
  badge: string;
  desc: string;
  rate: string;
  icon: any;
  color: string;
}

const OPTIONS: DecisionOptionItem[] = [
  { id: 'autonomous', label: 'Autonomous (JEV)', badge: '⚡ Auto', desc: 'Self-deciding via JEV System One; minimum questions', rate: '≥ 90', icon: Zap, color: 'text-amber-400' },
  { id: 'balanced', label: 'Balanced Engineering', badge: '⚖️ Balanced', desc: 'Resolves standard tasks; clarifies high-risk & major choices', rate: '≥ 65', icon: Scale, color: 'text-cyan-400' },
  { id: 'inquisitive', label: 'Inquisitive (Deep Context)', badge: '🔍 Inquisitive', desc: 'Actively probes missing context with A/B/C options', rate: '≥ 40', icon: Search, color: 'text-purple-400' },
  { id: 'rigorous', label: 'Rigorous Socratic', badge: '🛡️ Rigorous', desc: 'Exhaustive branch-by-branch interview before coding', rate: '≥ 20', icon: ShieldCheck, color: 'text-emerald-400' }
];

export const ChatDecisionLevelSelector: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLevel: AgentDecisionLevel = engineSettings.agentDecisionLevel || 'balanced';
  const activeOpt = OPTIONS.find(o => o.id === currentLevel) || OPTIONS[1];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (level: AgentDecisionLevel) => {
    updateEngineSettings({ agentDecisionLevel: level });
    window.lamApi?.settingsAPI?.saveSettings?.({ agentDecisionLevel: level });
    setIsOpen(false);
    addToast(`Agent Decision Level: ${level.toUpperCase()}`, 'info');
  };

  const Icon = activeOpt.icon;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all select-none cursor-pointer",
          currentLevel === 'autonomous' ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm" :
          currentLevel === 'rigorous' ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm" :
          currentLevel === 'inquisitive' ? "bg-purple-500/15 border-purple-500/40 text-purple-500 shadow-sm" :
          "surface-card hover:border-primary/40 text-app-sub border-subtle"
        )}
        title={`Decision Level: ${activeOpt.label} (Context Threshold: ${activeOpt.rate})`}
      >
        <Icon size={11} className={clsx("shrink-0", activeOpt.color)} />
        <span className="font-semibold">{activeOpt.badge}</span>
        <ChevronUp size={10} className={clsx("text-app-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 w-64 surface-dropdown rounded-xl border border-subtle shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 border-b border-subtle mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-app-muted uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert size={10} className="text-primary" /> Decision & Context Level
            </span>
            <span className="text-[9px] text-app-muted font-mono">JEV / Socratic</span>
          </div>

          <div className="space-y-1">
            {OPTIONS.map((opt) => {
              const isSelected = currentLevel === opt.id;
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={clsx(
                    "w-full text-left p-1.5 rounded-lg border transition-all flex items-start gap-2 cursor-pointer",
                    isSelected ? "bg-primary/15 border-primary/40 text-app-text" : "border-transparent hover:bg-primary/10 text-app-sub"
                  )}
                >
                  <OptIcon size={13} className={clsx("mt-0.5 shrink-0", opt.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-app-text">{opt.label}</span>
                      <span className="text-[9px] font-mono text-app-muted">Inquiry {opt.rate}</span>
                    </div>
                    <p className="text-[9.5px] text-app-muted leading-snug line-clamp-2 mt-0.5">{opt.desc}</p>
                  </div>
                  {isSelected && <Check size={12} className="text-primary shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
