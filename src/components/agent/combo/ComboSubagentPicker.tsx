import React, { useState } from 'react';
import { Search, Plus, Check, Bot } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import { AgentComboFlowType } from '../../../types/agent-combo';
import { ComboPipelineStepList } from './ComboPipelineStepList';
import { AgentClassBadge, PackageBadge } from '../../modals/agents-center/SubagentBadges';
import clsx from 'clsx';

interface ComboSubagentPickerProps {
  subagents: SubagentPersona[];
  selectedIds: string[];
  flowType: AgentComboFlowType;
  onReorder: (ids: string[]) => void;
  onToggle: (id: string) => void;
}

export const ComboSubagentPicker: React.FC<ComboSubagentPickerProps> = ({
  subagents,
  selectedIds,
  flowType,
  onReorder,
  onToggle
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const selectedSubagents = selectedIds
    .map((id) => subagents.find((s) => s.id === id))
    .filter((s): s is SubagentPersona => Boolean(s));

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    const next = [...selectedIds];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    onReorder(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= selectedIds.length - 1) return;
    const next = [...selectedIds];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    onReorder(next);
  };

  const filteredPool = subagents.filter((s) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* 1. Selected Pipeline Sequence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-gray-300">
            {flowType === 'sequential_pipeline' ? 'Thứ Tự Chuỗi Pipeline' : 'Thành Viên Đội Ngũ Combo'} ({selectedIds.length})
          </label>
          <span className="text-[10px] text-gray-400">
            {flowType === 'sequential_pipeline' ? 'Chuyền giao tuần tự từ trên xuống' : 'Phối hợp đa năng'}
          </span>
        </div>

        <ComboPipelineStepList
          selectedSubagents={selectedSubagents}
          flowType={flowType}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onRemove={onToggle}
        />
      </div>

      {/* 2. Available Subagents Pool */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold text-gray-300">Kho Subagents Có Thể Thêm</label>
          <div className="relative w-44">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Lọc subagent..."
              className="w-full pl-7 pr-2 py-1 rounded-lg surface-input border border-border text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {filteredPool.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                className={clsx(
                  "p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 group",
                  isSelected
                    ? "bg-purple-950/30 border-purple-500/40 text-gray-100"
                    : "surface-card border-white/5 hover:border-white/15 text-gray-300"
                )}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <div className={clsx(
                    "p-1.5 rounded-lg shrink-0",
                    isSelected ? "bg-purple-500/20 text-purple-300" : "bg-white/5 text-gray-400 group-hover:text-white"
                  )}>
                    <Bot size={13} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-gray-100 truncate">{s.name}</div>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <AgentClassBadge agentClass={s.agentClass} />
                      <PackageBadge model={s.model} />
                    </div>
                  </div>
                </div>

                <div className={clsx(
                  "p-1 rounded-lg shrink-0 text-[10px] font-semibold flex items-center gap-0.5",
                  isSelected
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-white/5 text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors"
                )}>
                  {isSelected ? <Check size={11} /> : <Plus size={11} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
