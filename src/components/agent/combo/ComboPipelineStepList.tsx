import React from 'react';
import { ArrowUp, ArrowDown, X, Bot, ArrowRight } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import { AgentComboFlowType } from '../../../types/agent-combo';
import { AgentClassBadge, PackageBadge } from '../../modals/agents-center/SubagentBadges';
import clsx from 'clsx';

interface ComboPipelineStepListProps {
  selectedSubagents: SubagentPersona[];
  flowType: AgentComboFlowType;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}

export const ComboPipelineStepList: React.FC<ComboPipelineStepListProps> = ({
  selectedSubagents,
  flowType,
  onMoveUp,
  onMoveDown,
  onRemove
}) => {
  if (selectedSubagents.length === 0) {
    return (
      <div className="py-6 px-4 rounded-xl border border-dashed border-white/10 text-center bg-black/10">
        <Bot size={20} className="mx-auto text-gray-500 mb-1.5 opacity-60" />
        <p className="text-xs text-gray-300 font-medium">Chưa có subagent nào trong nhóm Combo</p>
        <p className="text-[10px] text-gray-500 mt-0.5">Nhấp vào danh sách Subagent có sẵn bên dưới để thêm vào chuỗi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
      {selectedSubagents.map((agent, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === selectedSubagents.length - 1;
        const isPipeline = flowType === 'sequential_pipeline';

        return (
          <React.Fragment key={agent.id}>
            <div className="flex items-center justify-between p-2 rounded-xl border surface-card border-white/10 hover:border-white/20 transition-all gap-2 group">
              {/* Step & Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={clsx(
                  "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border",
                  isPipeline
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-purple-500/15 border-purple-500/30 text-purple-300"
                )}>
                  {isPipeline ? `#${idx + 1}` : `●`}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-200 truncate">{agent.name}</span>
                    <AgentClassBadge agentClass={agent.agentClass} />
                    <PackageBadge model={agent.model} />
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{agent.role}</p>
                </div>
              </div>

              {/* Order Controls & Remove */}
              <div className="flex items-center gap-1 shrink-0">
                {isPipeline && (
                  <div className="flex items-center bg-black/20 rounded-lg border border-white/5 p-0.5">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => onMoveUp(idx)}
                      title="Di chuyển lên trước trong chuỗi"
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => onMoveDown(idx)}
                      title="Di chuyển xuống sau trong chuỗi"
                      className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(agent.id)}
                  title="Gỡ khỏi combo"
                  className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Pipeline connector arrow */}
            {isPipeline && !isLast && (
              <div className="flex justify-center -my-0.5">
                <ArrowRight size={10} className="text-emerald-500/50 rotate-90" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
