import React from 'react';
import { Building2, Compass, Zap, LineChart, Check, Sparkles, LucideIcon } from 'lucide-react';
import { AgentClassType, AGENT_CLASS_REGISTRY } from '../../../../types/agent-class';
import clsx from 'clsx';

interface SubagentClassSectionProps {
  selectedClass: AgentClassType;
  onSelectClass: (cls: AgentClassType) => void;
  onApplyClassDefaults: () => void;
}

const CLASS_ICONS: Record<AgentClassType, LucideIcon> = {
  architecture: Building2,
  planner: Compass,
  executor: Zap,
  analytic: LineChart,
};

export const SubagentClassSection: React.FC<SubagentClassSectionProps> = ({
  selectedClass,
  onSelectClass,
  onApplyClassDefaults,
}) => {
  const classes: AgentClassType[] = ['architecture', 'planner', 'executor', 'analytic'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span>Agent Specialization Class</span>
          </h4>
          <p className="text-[11px] text-secondary">Class governs orchestration boundaries and role discipline</p>
        </div>
        <button
          type="button"
          onClick={onApplyClassDefaults}
          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors active:scale-95"
        >
          <Sparkles size={11} />
          <span>Apply Class Recommended Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {classes.map((cls) => {
          const meta = AGENT_CLASS_REGISTRY[cls];
          const Icon = CLASS_ICONS[cls];
          const isSelected = selectedClass === cls;

          return (
            <div
              key={cls}
              onClick={() => onSelectClass(cls)}
              className={clsx(
                "p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left relative",
                isSelected
                  ? "surface-card shadow-lg scale-[1.01] border-2"
                  : "surface-card border-subtle hover:border-medium opacity-80 hover:opacity-100"
              )}
              style={isSelected ? { borderColor: meta.themeColor } : undefined}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: `${meta.themeColor}25`, color: meta.themeColor }}
                  >
                    <Icon size={14} />
                  </div>
                  {isSelected && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-slate-950 font-bold"
                      style={{ backgroundColor: meta.themeColor }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="text-xs font-bold text-primary">{meta.name}</div>
                <div className="text-[10px] text-secondary line-clamp-2 mt-0.5 leading-snug">
                  {meta.description}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-subtle flex items-center justify-between">
                <span className={clsx("text-[9px] px-1.5 py-0.5 rounded border font-mono", meta.bgBadge)}>
                  {meta.badgeLabel}
                </span>
                <span className="text-[10px] text-muted font-mono">
                  {meta.recommendedSkills.length} recommended
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
