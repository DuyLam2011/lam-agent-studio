import React from 'react';
import { Bot, ArrowRight } from 'lucide-react';
import { AgentComboFlowType } from '../../../types/agent-combo';

interface ComboEnsemblePillsProps {
  subagentIds: string[];
  flowType: AgentComboFlowType;
  getSubagentName: (id: string) => string;
}

export const ComboEnsemblePills: React.FC<ComboEnsemblePillsProps> = ({
  subagentIds,
  flowType,
  getSubagentName
}) => {
  return (
    <div className="space-y-1 mb-1">
      <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider">
        <span>Subagent Ensemble ({subagentIds.length})</span>
        <span className="font-mono lowercase opacity-75">
          {flowType === 'sequential_pipeline' ? 'sequential pipeline' : 'flexible collaboration'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-black/20 border border-white/5">
        {subagentIds.map((id, idx) => (
          <React.Fragment key={id}>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-200">
              <span className="text-[9px] font-mono text-gray-400 font-bold">#{idx + 1}</span>
              <Bot size={10} className="text-primary shrink-0" />
              <span className="truncate max-w-[120px]">{getSubagentName(id)}</span>
            </span>
            {flowType === 'sequential_pipeline' && idx < subagentIds.length - 1 && (
              <ArrowRight size={10} className="text-emerald-500/60 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
