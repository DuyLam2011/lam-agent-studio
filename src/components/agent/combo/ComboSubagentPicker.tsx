import React from 'react';
import { Bot } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import clsx from 'clsx';

interface ComboSubagentPickerProps {
  subagents: SubagentPersona[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const ComboSubagentPicker: React.FC<ComboSubagentPickerProps> = ({
  subagents,
  selectedIds,
  onToggle
}) => {
  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl p-2 bg-black/10">
      {subagents.map((s) => {
        const selected = selectedIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            className={clsx(
              "w-full flex items-center justify-between p-2 rounded-lg border text-left transition-colors",
              selected
                ? "bg-purple-600/20 border-purple-500/40 text-gray-100"
                : "surface-card border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <div className="flex items-center gap-2">
              <Bot size={13} className={selected ? "text-purple-400" : "text-gray-500"} />
              <div>
                <div className="text-xs font-medium">{s.name}</div>
                <div className="text-[10px] text-gray-400">{s.role}</div>
              </div>
            </div>
            <span className={clsx("text-xs font-bold", selected ? "text-purple-400" : "text-transparent")}>✓</span>
          </button>
        );
      })}
    </div>
  );
};
