import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Check, Star, Plus } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import clsx from 'clsx';

interface SubagentRulesSectionProps {
  assignedRules: string[];
  onToggleRule: (ruleId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectRecommended: () => void;
  recommendedRules: string[];
  onOpenCreateModal: () => void;
}

export const SubagentRulesSection: React.FC<SubagentRulesSectionProps> = ({
  assignedRules,
  onToggleRule,
  onSelectAll,
  onClearAll,
  onSelectRecommended,
  recommendedRules,
  onOpenCreateModal,
}) => {
  const { agentRules } = useAgentStore();
  const [search, setSearch] = useState('');

  const filteredRules = useMemo(() => {
    if (!search.trim()) return agentRules;
    const q = search.toLowerCase();
    return agentRules.filter(
      (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }, [agentRules, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h4 className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={13} className="text-purple-400" />
            <span>Assigned Rules & Guardrails ({assignedRules.length})</span>
          </h4>
          <p className="text-[11px] text-app-sub">Strict behavioral policies enforced during agent turns</p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 font-semibold flex items-center gap-1 transition-all"
          >
            <Plus size={11} /> Create Rule
          </button>
          <button
            type="button"
            onClick={onSelectRecommended}
            className="px-2 py-0.5 rounded-lg surface-card text-purple-400 hover:brightness-110 border border-subtle font-medium"
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
          placeholder="Filter rules by name or identifier..."
          className="w-full surface-input border border-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-purple-400 transition-all"
        />
      </div>

      <div className="max-h-[175px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
        {filteredRules.map((rule) => {
          const isAssigned = assignedRules.includes(rule.id);
          const isRec = recommendedRules.some((r) => rule.id.includes(r) || rule.name.toLowerCase().includes(r));

          return (
            <div
              key={rule.id}
              onClick={() => onToggleRule(rule.id)}
              className={clsx(
                "p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 select-none",
                isAssigned
                  ? "bg-purple-500/10 border-purple-400/40 text-app-text shadow-sm"
                  : "surface-card border-subtle text-app-sub hover:border-medium hover:text-app-text"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={clsx(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    isAssigned ? "bg-purple-500 border-purple-400 text-white font-bold" : "border-subtle surface-input"
                  )}
                >
                  {isAssigned && <Check size={10} strokeWidth={3} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{rule.name}</span>
                    <span className="text-[10px] text-muted font-mono">({rule.id})</span>
                    {isRec && (
                      <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded flex items-center gap-0.5">
                        <Star size={8} className="fill-amber-300" /> Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-secondary truncate">{rule.description}</p>
                </div>
              </div>

              <span className="text-[9px] text-muted uppercase font-mono px-1.5 py-0.5 surface-input rounded border border-subtle shrink-0">
                {rule.scope || 'rule'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
