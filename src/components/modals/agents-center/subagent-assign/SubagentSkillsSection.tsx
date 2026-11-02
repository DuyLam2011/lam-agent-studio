import React, { useState, useMemo } from 'react';
import { Search, Wrench, Check, Star, Plus } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import clsx from 'clsx';

interface SubagentSkillsSectionProps {
  assignedSkills: string[];
  onToggleSkill: (skillName: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectRecommended: () => void;
  recommendedSkills: string[];
  onOpenCreateModal: () => void;
}

export const SubagentSkillsSection: React.FC<SubagentSkillsSectionProps> = ({
  assignedSkills,
  onToggleSkill,
  onSelectAll,
  onClearAll,
  onSelectRecommended,
  recommendedSkills,
  onOpenCreateModal,
}) => {
  const { agentSkills } = useAgentStore();
  const [search, setSearch] = useState('');

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return agentSkills;
    const q = search.toLowerCase();
    return agentSkills.filter(
      (s) => s.name.toLowerCase().includes(q) || s.folderName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [agentSkills, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h4 className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-1.5">
            <Wrench size={13} className="text-cyan-400" />
            <span>Assigned Skills ({assignedSkills.length})</span>
          </h4>
          <p className="text-[11px] text-app-sub">Toolkits available when executing autonomous tasks</p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 font-semibold flex items-center gap-1 transition-all"
          >
            <Plus size={11} /> Create Skill
          </button>
          <button
            type="button"
            onClick={onSelectRecommended}
            className="px-2 py-0.5 rounded-lg surface-card text-cyan-400 hover:brightness-110 border border-subtle font-medium"
          >
            Recommended
          </button>
          <button
            type="button"
            onClick={onSelectAll}
            className="px-2 py-0.5 rounded-lg surface-card text-app-sub hover:text-app-text border border-subtle"
          >
            All
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="px-2 py-0.5 rounded-lg surface-card text-app-muted hover:text-rose-400 border border-subtle"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-2.5 text-app-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter skills by name or folder..."
          className="w-full surface-input border border-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-cyan-400 transition-all"
        />
      </div>

      <div className="max-h-[175px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
        {filteredSkills.map((skill) => {
          const isAssigned = assignedSkills.includes(skill.folderName);
          const isRec = recommendedSkills.includes(skill.folderName);

          return (
            <div
              key={skill.id}
              onClick={() => onToggleSkill(skill.folderName)}
              className={clsx(
                "p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 select-none",
                isAssigned
                  ? "bg-cyan-500/10 border-cyan-400/40 text-app-text shadow-sm"
                  : "surface-card border-subtle text-app-sub hover:border-medium hover:text-app-text"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={clsx(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    isAssigned ? "bg-cyan-500 border-cyan-400 text-slate-950 font-bold" : "border-subtle surface-input"
                  )}
                >
                  {isAssigned && <Check size={10} strokeWidth={3} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{skill.name}</span>
                    <span className="text-[10px] text-muted font-mono">({skill.folderName})</span>
                    {isRec && (
                      <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded flex items-center gap-0.5">
                        <Star size={8} className="fill-amber-300" /> Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-secondary truncate">{skill.description}</p>
                </div>
              </div>

              <span className="text-[9px] text-muted uppercase font-mono px-1.5 py-0.5 surface-input rounded border border-subtle shrink-0">
                {skill.category || 'skill'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
