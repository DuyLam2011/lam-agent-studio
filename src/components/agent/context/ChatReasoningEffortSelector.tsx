import React, { useState, useRef, useEffect } from 'react';
import { Zap, Brain, Flame, Users2, Check, Gauge } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore, HardworkLevel, ReasoningEffort } from '../../../store/useAgentStore';

interface HardworkOption {
  level: HardworkLevel;
  effort: ReasoningEffort;
  label: string;
  badge: string;
  desc: string;
  useCase: string;
  speedRating: string;
  intelRating: string;
  teamSize: string;
  icon: any;
  color: string;
  bg: string;
}

const HARDWORK_OPTIONS: HardworkOption[] = [
  { level: 'rapid', effort: 'low', label: 'Rapid (Speed)', badge: '⚡ Rapid', desc: 'Direct execution without planning or review overhead', useCase: 'Quick edits & atomic scripts', speedRating: '⚡⚡⚡⚡⚡ Max', intelRating: '🧠🧠 Fast', teamSize: '1 Agent', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { level: 'balanced', effort: 'medium', label: 'Balanced', badge: '⚖️ Balanced', desc: 'Pair engineering: Code Executor + Architecture Reviewer', useCase: 'Daily feature development & PR preparation', speedRating: '⚡⚡⚡ High', intelRating: '🧠🧠🧠 Standard', teamSize: '2 Agents', icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { level: 'deep', effort: 'high', label: 'Deep Hardwork', badge: '🧠 Deep', desc: '3-stage pipeline: Milestone Planner + Executor + Reviewer', useCase: 'Complex logic & architectural changes', speedRating: '⚡⚡ Medium', intelRating: '🧠🧠🧠🧠 Deep', teamSize: '3 Agents', icon: Flame, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { level: 'max_swarm', effort: 'high', label: 'Max Swarm', badge: '🔥 Max Swarm', desc: '5-subagent swarm: Planner + OWASP + Code + Review + QA', useCase: 'Mission-critical releases & security audits', speedRating: '⚡ Deep Loop', intelRating: '🧠🧠🧠🧠🧠 Max', teamSize: '5 Subagents', icon: Users2, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' }
];

export const ChatReasoningEffortSelector: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast, setSettingCenterModalOpen } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLevel: HardworkLevel = engineSettings.hardworkLevel || 'deep';
  const activeCfg = HARDWORK_OPTIONS.find(o => o.level === currentLevel) || HARDWORK_OPTIONS[2];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (opt: HardworkOption) => {
    updateEngineSettings({ hardworkLevel: opt.level, reasoningEffort: opt.effort });
    window.lamApi?.settingsAPI?.saveSettings?.({ hardworkLevel: opt.level, reasoningEffort: opt.effort });
    addToast(`Reasoning Effort: ${opt.label} (${opt.teamSize})`, 'info');
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer select-none",
          activeCfg.bg, activeCfg.color
        )}
        title="Reasoning Effort & Swarm Depth: Adjust intelligence tier, speed & subagent team scale"
      >
        <span>{activeCfg.badge}</span>
      </button>

      {isOpen && (
        <div className="surface-dropdown absolute right-0 bottom-full mb-2 w-80 rounded-2xl shadow-2xl border border-subtle p-2.5 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-subtle">
            <div>
              <div className="text-xs font-bold text-app-text flex items-center gap-1.5">
                <Gauge size={13} className="text-primary" />
                <span>Coding Effort & Intelligence Depth</span>
              </div>
              <p className="text-[10px] text-app-muted mt-0.5">Select agent cognitive budget, speed vs verification tier</p>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
            {HARDWORK_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = currentLevel === opt.level;
              return (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={clsx(
                    "w-full p-2 rounded-xl text-left transition-all border group cursor-pointer",
                    isSelected
                      ? "bg-primary/15 border-primary/50 text-app-text shadow-sm"
                      : "surface-card border-subtle hover:border-primary/35 text-app-sub"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={opt.color} />
                      <span className="text-xs font-bold text-app-text group-hover:text-primary">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] surface-input border border-subtle text-app-sub">
                        {opt.teamSize}
                      </span>
                      {isSelected && <Check size={12} className="text-primary shrink-0" />}
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-300 mt-1 leading-snug">{opt.desc}</p>
                  <p className="text-[9.5px] text-gray-400 italic mt-0.5 leading-snug">{opt.useCase}</p>

                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5 text-[9px] font-mono text-gray-400">
                    <span>Speed: <strong className="text-amber-300 font-normal">{opt.speedRating}</strong></span>
                    <span>Intel: <strong className="text-purple-300 font-normal">{opt.intelRating}</strong></span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
            <span>Provider: <strong className="text-gray-200 capitalize font-medium">{engineSettings.provider || 'Antigravity'}</strong></span>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setSettingCenterModalOpen(true); }}
              className="text-primary hover:underline cursor-pointer"
            >
              Engine Settings...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
