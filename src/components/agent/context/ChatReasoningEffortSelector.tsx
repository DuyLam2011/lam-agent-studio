import React, { useState, useRef, useEffect } from 'react';
import { Zap, Brain, Flame, Users2 } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore, HardworkLevel, ReasoningEffort } from '../../../store/useAgentStore';

interface HardworkOption {
  level: HardworkLevel;
  effort: ReasoningEffort;
  label: string;
  badge: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
}

const HARDWORK_OPTIONS: HardworkOption[] = [
  { level: 'rapid', effort: 'low', label: 'Rapid (Fast)', badge: '⚡ Rapid', desc: '1 Agent, 1k thinking, tốc độ tối đa', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { level: 'balanced', effort: 'medium', label: 'Balanced', badge: '⚖️ Balanced', desc: '2 Agents (Executor + Reviewer)', icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { level: 'deep', effort: 'high', label: 'Deep Hardwork', badge: '🧠 Deep', desc: '3 Agents (Planner + Exec + Review)', icon: Flame, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { level: 'max_swarm', effort: 'high', label: 'Max Swarm', badge: '🔥 Max Swarm', desc: 'Toàn bộ 5 Subagents hoàn thiện tối đa', icon: Users2, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' }
];

export const ChatReasoningEffortSelector: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
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
    addToast(`Độ Hardwork: ${opt.label} (${opt.desc})`, 'info');
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx("flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer", activeCfg.bg, activeCfg.color)}
        title="Độ Hardwork & Reasoning: Điều chỉnh mức độ thông minh và quy mô subagent hoàn thiện task"
      >
        <span>{activeCfg.badge}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 w-60 surface-panel rounded-xl shadow-2xl border border-subtle p-1.5 z-50 animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-muted border-b border-subtle">
            Độ Hardwork & Quy Mô Subagents
          </div>
          {HARDWORK_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = currentLevel === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => handleSelect(opt)}
                className={clsx(
                  "w-full flex flex-col items-start px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer",
                  isSelected ? "bg-primary/20 text-primary font-bold" : "hover:bg-white/5 text-secondary hover:text-app-text"
                )}
              >
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} className={opt.color} />
                    <span className="text-[11px]">{opt.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted">{opt.badge.split(' ')[0]}</span>
                </div>
                <span className="text-[9.5px] text-muted font-normal mt-0.5">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
