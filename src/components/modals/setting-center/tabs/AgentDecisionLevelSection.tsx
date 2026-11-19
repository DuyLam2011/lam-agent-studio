import React from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { AgentDecisionLevel } from '../../../../types/settings-center';
import { ShieldAlert, Zap, Scale, Search, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

interface DecisionLevelOption {
  level: AgentDecisionLevel;
  badge: string;
  title: string;
  desc: string;
  inquiryRate: string;
  icon: any;
  color: string;
  bg: string;
}

const DECISION_LEVELS: DecisionLevelOption[] = [
  {
    level: 'autonomous',
    badge: '⚡ Autonomous (JEV)',
    title: 'Autonomous Execution',
    desc: 'Self-deciding via JEV confidence scoring. Assumes conventions with minimal user questions.',
    inquiryRate: 'Very Low (≥ 90)',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30'
  },
  {
    level: 'balanced',
    badge: '⚖️ Balanced',
    title: 'Balanced Engineering',
    desc: 'Resolves standard tasks autonomously; clarifies high-risk operations & major architectural choices.',
    inquiryRate: 'Moderate (≥ 65)',
    icon: Scale,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30'
  },
  {
    level: 'inquisitive',
    badge: '🔍 Inquisitive',
    title: 'Deep Context Gathering',
    desc: 'Actively probes missing context & trade-offs, presenting structured A/B/C options with recommendations.',
    inquiryRate: 'High (≥ 40)',
    icon: Search,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30'
  },
  {
    level: 'rigorous',
    badge: '🛡️ Rigorous',
    title: 'Socratic Interview',
    desc: 'Exhaustive branch-by-branch interview. Zero code mutations until all decisions are locked.',
    inquiryRate: 'Exhaustive (≥ 20)',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/40'
  }
];

export const AgentDecisionLevelSection: React.FC = () => {
  const { engineSettings, updateEngineSettings, addToast } = useAgentStore();
  const currentLevel = engineSettings.agentDecisionLevel || 'balanced';

  const handleSelect = (level: AgentDecisionLevel) => {
    updateEngineSettings({ agentDecisionLevel: level });
    window.lamApi?.settingsAPI?.saveSettings?.({ agentDecisionLevel: level });
    addToast(`Agent Decision Level: ${level.toUpperCase()}`, 'info');
  };

  return (
    <div className="p-2.5 rounded-xl surface-card border border-subtle space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={13} className="text-primary" />
          Agent Decision Level (Context & Autonomy)
        </label>
        <span className="text-primary font-mono text-[10px] uppercase font-bold">{currentLevel}</span>
      </div>
      <p className="text-[10px] text-muted">
        Inspired by JEV System One confidence evaluation and Socratic context acquisition. Controls how much context the agent demands from you versus deciding autonomously.
      </p>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {DECISION_LEVELS.map((opt) => {
          const isSelected = currentLevel === opt.level;
          const Icon = opt.icon;
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => handleSelect(opt.level)}
              className={clsx(
                "p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                isSelected
                  ? clsx(opt.bg, "ring-1 ring-primary/30 shadow-sm")
                  : "bg-black/20 border-subtle hover:border-white/20 text-secondary hover:text-app-text"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className={clsx("font-bold text-[11px] flex items-center gap-1.5", opt.color)}>
                  <Icon size={12} />
                  {opt.title}
                </span>
                <span className="text-[9px] font-mono text-muted">{opt.inquiryRate}</span>
              </div>
              <p className="text-[9.5px] text-muted leading-relaxed line-clamp-2">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
