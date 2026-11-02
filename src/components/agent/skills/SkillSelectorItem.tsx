import React from 'react';
import { Zap, Check, Shield, Code, Palette, Database, Terminal, FileCode } from 'lucide-react';
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
  const getIcon = (name: string, folderName?: string) => {
    const key = `${name} ${folderName || ''}`.toLowerCase();
    if (key.includes('security') || key.includes('audit')) return <Shield size={13} className="text-rose-400" />;
    if (key.includes('code') || key.includes('review')) return <Code size={13} className="text-cyan-400" />;
    if (key.includes('ui') || key.includes('design') || key.includes('glassmorphism')) return <Palette size={13} className="text-pink-400" />;
    if (key.includes('mongo') || key.includes('database') || key.includes('sql')) return <Database size={13} className="text-emerald-400" />;
    if (key.includes('terminal') || key.includes('bash')) return <Terminal size={13} className="text-amber-400" />;
    if (key.includes('test')) return <FileCode size={13} className="text-indigo-400" />;
    return <Zap size={13} className="text-primary" />;
  };

  const displayName = skill.name.replace(/\s*\([^)]*\)$/, '');

  return (
    <div
      onClick={() => onToggle(skill.name)}
      className={clsx(
        "p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 select-none",
        isActive
          ? "bg-primary/[0.08] border-primary/40 text-app-text shadow-sm"
          : "surface-card border-subtle text-app-sub hover:border-medium hover:text-app-text hover:brightness-105"
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="mt-0.5 shrink-0 p-1 rounded-md surface-input border border-subtle">
          {getIcon(skill.name, skill.folderName)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-app-text tracking-tight">{displayName}</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded surface-input text-app-muted border border-subtle">
              {skill.scope}
            </span>
          </div>
          <p className="text-[11px] text-app-sub line-clamp-2 mt-0.5 leading-relaxed">
            {skill.description || 'Autonomous skill for agent instruction and specialized tool execution.'}
          </p>
        </div>
      </div>

      <div
        className={clsx(
          "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          isActive
            ? "bg-primary border-primary text-[var(--primary-contrast,#ffffff)] font-bold shadow-sm"
            : "border-subtle surface-input text-transparent hover:border-medium"
        )}
      >
        <Check size={11} strokeWidth={3} />
      </div>
    </div>
  );
};