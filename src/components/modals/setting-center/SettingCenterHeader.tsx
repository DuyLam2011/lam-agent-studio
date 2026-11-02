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
            Quản lý giao diện, quyền hạn lệnh Terminal, Browser Tool & File Sandboxing
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-secondary hover:text-primary hover:bg-primary/10 border border-subtle transition-all cursor-pointer"
          title="Khôi phục toàn bộ cài đặt mặc định"
        >
          <RotateCcw size={12} />
          <span>Mặc định</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          title="Đóng cửa sổ"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
