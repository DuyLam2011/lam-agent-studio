import React from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import { ChatFilterState } from '../../../services/agent-chat/chatFilterService';

interface ChatSearchBarProps {
  filter: ChatFilterState;
  onFilterChange: (patch: Partial<ChatFilterState>) => void;
  matchesCount: number;
  totalCount: number;
  onClose: () => void;
}

export const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  filter,
  onFilterChange,
  matchesCount,
  totalCount,
  onClose
}) => {
  const roleFilters: Array<{ id: ChatFilterState['roleFilter']; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'user', label: 'User' },
    { id: 'agent', label: 'Agent' },
    { id: 'tool', label: 'Tools' },
    { id: 'error', label: 'Errors' }
  ];

  return (
    <div className="mx-3 mt-1.5 p-2 rounded-xl surface-card border border-primary/20 space-y-1.5 shadow-lg animate-in slide-in-from-top-1 duration-150 relative z-30">
      <div className="flex items-center gap-1.5 min-w-0">
        <Search size={12} className="text-primary shrink-0 ml-1" />
        <input
          type="text"
          value={filter.query}
          autoFocus
          onChange={(e) => onFilterChange({ query: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          placeholder="Search messages, reasoning, tools, errors... (Esc to close)"
          className="flex-1 bg-transparent text-xs text-app-text placeholder-app-muted focus:outline-none min-w-0"
        />

        {filter.query && (
          <button
            type="button"
            onClick={() => onFilterChange({ query: '' })}
            className="p-1 text-app-muted hover:text-app-text"
            title="Clear search"
          >
            <X size={11} />
          </button>
        )}

        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-primary shrink-0">
          {matchesCount} / {totalCount}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-app-muted hover:text-app-text hover:bg-white/5 transition-colors shrink-0"
          title="Close search bar (Esc)"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pt-0.5">
        <span className="text-[9.5px] uppercase font-bold tracking-wider text-app-muted px-1 shrink-0">
          Filter:
        </span>
        {roleFilters.map((rf) => {
          const isActive = filter.roleFilter === rf.id;
          return (
            <button
              key={rf.id}
              type="button"
              onClick={() => onFilterChange({ roleFilter: rf.id })}
              className={clsx(
                "px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0",
                isActive
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200"
              )}
            >
              {rf.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onFilterChange({ hasDiffOnly: !filter.hasDiffOnly })}
          className={clsx(
            "ml-auto px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 border",
            filter.hasDiffOnly
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
          )}
        >
          Diffs Only
        </button>
      </div>
    </div>
  );
};
