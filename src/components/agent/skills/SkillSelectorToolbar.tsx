import React from 'react';
import { Search } from 'lucide-react';

interface SkillSelectorToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeCount: number;
  totalCount: number;
  onApplyEssentials: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export const SkillSelectorToolbar: React.FC<SkillSelectorToolbarProps> = ({
  search,
  onSearchChange,
  activeCount,
  totalCount,
  onApplyEssentials,
  onSelectAll,
  onClear,
}) => {
  return (
    <div className="p-3 border-b border-subtle space-y-2 surface-header/50">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-2.5 text-app-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search skills across active workspace..."
          className="w-full surface-input border border-subtle rounded-xl py-1.5 pl-9 pr-3 text-xs text-app-text placeholder:text-app-muted focus:outline-none focus:border-active transition-all"
        />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-app-sub font-mono">
          {activeCount} of {totalCount} active
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onApplyEssentials}
            className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-colors font-medium active:scale-95"
          >
            Coding Essentials
          </button>
          <button
            type="button"
            onClick={onSelectAll}
            className="px-2 py-0.5 rounded-lg border border-subtle surface-card hover:brightness-110 text-app-sub hover:text-app-text transition-colors active:scale-95"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 rounded-lg border border-subtle surface-card hover:brightness-110 text-app-muted hover:text-app-sub transition-colors active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};