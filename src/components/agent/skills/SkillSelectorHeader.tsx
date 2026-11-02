import React from 'react';
import { X, Zap, Layers } from 'lucide-react';

interface SkillSelectorHeaderProps {
  workspaceName: string;
  onClose: () => void;
}

export const SkillSelectorHeader: React.FC<SkillSelectorHeaderProps> = ({
  workspaceName,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-subtle surface-header">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <Zap size={14} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-app-text tracking-wide">Dynamic Skills Applicator</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 font-mono">
              <Layers size={10} /> {workspaceName}
            </span>
          </div>
          <p className="text-[10px] text-app-sub">Skills active for the current focused workspace AI session</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
};