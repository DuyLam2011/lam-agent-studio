import React from 'react';
import { AgentClassType } from '../../../types/agent-class';
import { Layers, Building2, Compass, Zap, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface AgentClassFilterBarProps {
  selectedClass: AgentClassType | 'all';
  onSelectClass: (cls: AgentClassType | 'all') => void;
  counts: Record<AgentClassType | 'all', number>;
}

export const AgentClassFilterBar: React.FC<AgentClassFilterBarProps> = ({
  selectedClass,
  onSelectClass,
  counts
}) => {
  const tabs: Array<{ id: AgentClassType | 'all'; label: string; icon: LucideIcon }> = [
    { id: 'all', label: 'All Classes', icon: Layers },
    { id: 'architecture', label: 'Architecture', icon: Building2 },
    { id: 'planner', label: 'Planner', icon: Compass },
    { id: 'executor', label: 'Executor', icon: Zap }
  ];

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isSelected = selectedClass === id;
        return (
          <button
            key={id}
            onClick={() => onSelectClass(id)}
            className={clsx(
              "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0",
              isSelected
                ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
            )}
          >
            <Icon size={12} />
            <span>{label}</span>
            <span className={clsx(
              "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
              isSelected ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-gray-500"
            )}>
              {counts[id] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};
