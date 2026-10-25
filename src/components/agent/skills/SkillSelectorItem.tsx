import React from 'react';
import { Zap, Check, Shield, Code } from 'lucide-react';
import clsx from 'clsx';

interface SkillSelectorItemProps {
  skill: {
    id: string;
    name: string;
    description: string;
    scope: string;
    folderName?: string;
  };
  isActive: boolean;
  onToggle: (name: string) => void;
}

export const SkillSelectorItem: React.FC<SkillSelectorItemProps> = ({ skill, isActive, onToggle }) => {
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('security')) return <Shield size={13} className="text-rose-400" />;
    if (lower.includes('code') || lower.includes('review')) return <Code size={13} className="text-cyan-400" />;
    return <Zap size={13} className="text-amber-400" />;
  };

  return (
    <div
      onClick={() => onToggle(skill.name)}
      className={clsx(
        "p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 select-none",
        isActive
          ? "bg-amber-500/10 border-amber-500/30 text-white shadow-sm"
          : "bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/[0.06] hover:border-white/10"
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        <div className="mt-0.5 shrink-0">{getIcon(skill.name)}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white truncate">{skill.name}</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400">
              {skill.scope}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
            {skill.description || 'Custom autonomous skill for agent instruction and tool calling.'}
          </p>
        </div>
      </div>

      <div className={clsx(
        "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
        isActive ? "bg-amber-500 border-amber-500 text-black font-bold" : "border-white/20 bg-black/40 text-transparent"
      )}>
        <Check size={11} strokeWidth={3} />
      </div>
    </div>
  );
};
