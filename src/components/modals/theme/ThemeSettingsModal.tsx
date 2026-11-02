import React, { useEffect, useState } from 'react';
import { X, Palette, FolderOpen, Check } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { ACCENT_COLORS, THEME_MODES, THEME_STYLES } from './themeConstants';
import { fetchThemeStorageInfo, openThemesStorageFolder, ThemeStorageInfo } from '../../../services/themePersistenceService';
import clsx from 'clsx';

export const ThemeSettingsModal: React.FC = () => {
  const {
    isThemeModalOpen, setThemeModalOpen, themeMode, setThemeMode,
    themeStyle, setThemeStyle, accentColor, setAccentColor, addToast
  } = useAgentStore();

  const [storageInfo, setStorageInfo] = useState<ThemeStorageInfo | null>(null);

  useEffect(() => {
    if (isThemeModalOpen) {
      fetchThemeStorageInfo().then((info) => {
        if (info) setStorageInfo(info);
      }).catch(console.error);
    }
  }, [isThemeModalOpen]);

  if (!isThemeModalOpen) return null;

  const handleOpenFolder = async () => {
    const success = await openThemesStorageFolder();
    if (success) addToast('Opened themes directory', 'info');
    else addToast('Could not open folder', 'error');
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="surface-panel w-full max-w-lg p-5 flex flex-col gap-4 shadow-2xl relative select-none">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-primary" />
            <h3 className="text-sm font-semibold tracking-wide">Appearance & Design System</h3>
          </div>
          <button
            onClick={() => setThemeModalOpen(false)}
            className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Color Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-app-muted uppercase tracking-wider">Color Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {THEME_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setThemeMode(id)}
                className={clsx(
                  "surface-card flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                  themeMode === id ? "border-primary text-primary font-semibold shadow-sm" : "text-app-sub"
                )}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Design Paradigm Style */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-app-muted uppercase tracking-wider">Design Style</label>
          <div className="grid grid-cols-3 gap-2">
            {THEME_STYLES.map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setThemeStyle(id)}
                className={clsx(
                  "surface-card flex flex-col items-start p-2.5 rounded-lg text-left transition-all",
                  themeStyle === id ? "border-primary shadow-sm" : "text-app-sub"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Icon size={12} className={themeStyle === id ? "text-primary" : "text-app-muted"} />
                    <span className={themeStyle === id ? "text-primary" : "text-app-text"}>{label}</span>
                  </div>
                  {themeStyle === id && <Check size={12} className="text-primary" />}
                </div>
                <span className="text-[10px] text-app-muted leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-app-muted uppercase tracking-wider">Main Studio Color (Header & Controls)</label>
          <div className="flex items-center gap-2">
            {ACCENT_COLORS.map(({ name, value, bg }) => (
              <button
                key={value}
                onClick={() => setAccentColor(value)}
                className={clsx(
                  "w-6 h-6 rounded-full transition-transform flex items-center justify-center",
                  bg,
                  accentColor === value ? "scale-110 ring-2 ring-white/50" : "hover:scale-105 opacity-80 hover:opacity-100"
                )}
                title={name}
              >
                {accentColor === value && <Check size={11} className="text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        {/* Dedicated Theme Directory Storage Info */}
        <div className="p-2.5 rounded-xl bg-black/20 border border-border flex items-center justify-between gap-3 text-xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-app-muted uppercase">
              <span>Theme Storage Directory</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded text-[9px]">Active Profile</span>
            </div>
            <div className="text-[10px] text-app-sub font-mono truncate mt-0.5" title={storageInfo?.appearancePath}>
              {storageInfo?.appearancePath || 'userData/config/themes/appearance.json'}
            </div>
          </div>
          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg surface-card text-xs font-medium hover:text-primary transition-colors shrink-0"
            title="Open Themes Directory in Explorer"
          >
            <FolderOpen size={12} />
            <span>Open Folder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
