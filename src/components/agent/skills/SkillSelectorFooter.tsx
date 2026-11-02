import React from 'react';

interface SkillSelectorFooterProps {
  activeCount: number;
  totalCount: number;
  onClose: () => void;
}

export const SkillSelectorFooter: React.FC<SkillSelectorFooterProps> = ({
  activeCount,
  totalCount,
  onClose,
}) => {
  return (
    <div className="px-4 py-3 border-t border-subtle surface-header flex items-center justify-between">
      <span className="text-[11px] text-app-sub font-mono">
        {activeCount} of {totalCount} selected
      </span>
      <button
        onClick={onClose}
        className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-[var(--primary-contrast,#ffffff)] font-bold text-xs transition-all shadow-md active:scale-95"
      >
        Apply & Close
      </button>
    </div>
  );
};