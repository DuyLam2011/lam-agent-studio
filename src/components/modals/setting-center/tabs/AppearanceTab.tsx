import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { ACCENT_COLORS, THEME_MODES, THEME_STYLES } from '../../theme/themeConstants';
import { fetchThemeStorageInfo, openThemesStorageFolder, ThemeStorageInfo } from '../../../../services/themePersistenceService';
import { FolderOpen, Check } from 'lucide-react';
import clsx from 'clsx';

export const AppearanceTab: React.FC = () => {
  const {
    themeMode, setThemeMode, themeStyle, setThemeStyle,
    accentColor, setAccentColor, addToast
  } = useAgentStore();
  const [storageInfo, setStorageInfo] = useState<ThemeStorageInfo | null>(null);

  useEffect(() => {
    fetchThemeStorageInfo().then((info) => {
      if (info) setStorageInfo(info);
    }).catch(console.error);
  }, []);

  const handleOpenFolder = async () => {
    const success = await openThemesStorageFolder();
    if (success) addToast('Đã mở thư mục cấu hình themes', 'info');
    else addToast('Không thể mở thư mục themes', 'error');
  };

  return (
    <div className="space-y-5 p-1 select-none">
      {/* Color Mode */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          Chế Độ Màu (Color Mode)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {THEME_MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setThemeMode(id)}
              className={clsx(
                "surface-card flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer border",
                themeMode === id ? "border-primary text-primary font-semibold shadow-sm bg-primary/10" : "border-subtle text-secondary hover:text-app-text"
              )}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Paradigm / Style */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          Phong Cách Giao Diện (Visual Paradigm)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {THEME_STYLES.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setThemeStyle(id)}
              className={clsx(
                "surface-card flex flex-col items-start p-3 rounded-xl text-left transition-all cursor-pointer border",
                themeStyle === id ? "border-primary text-primary shadow-sm bg-primary/10" : "border-subtle text-secondary hover:text-app-text"
              )}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs mb-1">
                <Icon size={14} />
                <span>{label}</span>
              </div>
              <span className="text-[10px] text-muted line-clamp-2 leading-tight">
                {desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Palette */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          Màu Nhấn (Accent Color)
        </label>
        <div className="flex items-center gap-3 flex-wrap p-2 rounded-xl surface-card border border-subtle">
          {ACCENT_COLORS.map(({ name, value }) => {
            const isSelected = accentColor.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={value}
                type="button"
                onClick={() => setAccentColor(value)}
                className="relative group p-1 rounded-full cursor-pointer transition-transform hover:scale-110"
                title={`${name} (${value})`}
              >
                <div
                  className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm",
                    isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-85 hover:opacity-100"
                  )}
                  style={{ backgroundColor: value }}
                >
                  {isSelected && <Check size={12} className="text-white drop-shadow-sm" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage Location */}
      <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs text-muted">
        <span className="truncate max-w-[340px]" title={storageInfo?.themesDir}>
          Vị trí lưu file: <code className="text-[10px] text-secondary font-mono">{storageInfo?.themesDir || 'config/themes'}</code>
        </span>
        <button
          type="button"
          onClick={handleOpenFolder}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] surface-card border border-subtle text-secondary hover:text-app-text transition-colors cursor-pointer"
        >
          <FolderOpen size={13} />
          Mở thư mục
        </button>
      </div>
    </div>
  );
};
