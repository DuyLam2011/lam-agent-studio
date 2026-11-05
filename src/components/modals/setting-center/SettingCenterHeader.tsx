import React from 'react';
import { Settings, X, RotateCcw } from 'lucide-react';

interface SettingCenterHeaderProps {
  onClose: () => void;
  onResetDefaults: () => void;
}

export const SettingCenterHeader: React.FC<SettingCenterHeaderProps> = ({
  onClose,
  onResetDefaults,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-subtle surface-header shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <Settings size={18} className="animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-app-text">
            Setting Center
          </h2>
          <p className="text-[11px] text-muted">
            Manage appearance, terminal command permissions, browser tools & file sandboxing
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-secondary hover:text-primary hover:bg-primary/10 border border-subtle transition-all cursor-pointer"
          title="Reset all settings to defaults"
        >
          <RotateCcw size={12} />
          <span>Reset Defaults</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          title="Close window"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
