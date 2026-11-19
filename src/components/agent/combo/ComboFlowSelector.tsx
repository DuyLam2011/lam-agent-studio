import React from 'react';
import { GitCommit, Zap, Network, Check, LucideIcon } from 'lucide-react';
import { AgentComboFlowType } from '../../../types/agent-combo';
import clsx from 'clsx';

interface FlowOption {
  type: AgentComboFlowType;
  title: string;
  tag: string;
  desc: string;
  icon: LucideIcon;
  accentColor: string;
}

const FLOW_OPTIONS: FlowOption[] = [
  {
    type: 'sequential_pipeline',
    title: 'Sequential Pipeline',
    tag: 'Sequential Steps',
    desc: 'Pass deliverables sequentially (#1 → #2 → #3). Previous output feeds next agent.',
    icon: GitCommit,
    accentColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  {
    type: 'parallel_swarm',
    title: 'Parallel Swarm',
    tag: 'Multi-Agent Parallel',
    desc: 'Subagents execute concurrently, analyzing multi-perspective insights simultaneously.',
    icon: Zap,
    accentColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10'
  },
  {
    type: 'lead_delegation',
    title: 'Lead DAG Delegation',
    tag: 'Father Agent Directed',
    desc: 'Father Agent acts as lead architect, analyzing tasks and delegating with strict contracts.',
    icon: Network,
    accentColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10'
  }
];

interface ComboFlowSelectorProps {
  flowType: AgentComboFlowType;
  onChange: (flow: AgentComboFlowType) => void;
}

export const ComboFlowSelector: React.FC<ComboFlowSelectorProps> = ({ flowType, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-gray-300">Execution Flow Architecture</label>
        <span className="text-[10px] text-gray-400 font-mono">
          {FLOW_OPTIONS.find((f) => f.type === flowType)?.tag}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {FLOW_OPTIONS.map((opt) => {
          const isSelected = flowType === opt.type;
          const Icon = opt.icon;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => onChange(opt.type)}
              className={clsx(
                "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 relative group",
                isSelected
                  ? `${opt.accentColor} shadow-md`
                  : "surface-card border-white/5 hover:border-white/20 text-gray-400 hover:text-gray-200"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <Icon size={14} className={isSelected ? "" : "text-gray-400"} />
                  <span className="text-[11px] font-bold text-gray-100">{opt.title}</span>
                </div>
                {isSelected && <Check size={12} className="text-emerald-400 shrink-0" />}
              </div>

              <p className="text-[10px] leading-relaxed line-clamp-2 text-gray-300">
                {opt.desc}
              </p>

              <span className="text-[9px] font-medium tracking-wide opacity-80 mt-0.5">
                ● {opt.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
