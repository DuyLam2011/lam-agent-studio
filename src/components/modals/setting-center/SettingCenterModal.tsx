import React, { useState } from 'react';
import { useAgentStore } from '../../../store/useAgentStore';
import { SettingCenterTab } from '../../../types/settings-center';
import { SettingCenterHeader } from './SettingCenterHeader';
import { AppearanceTab } from './tabs/AppearanceTab';
import { TerminalPermissionsTab } from './tabs/TerminalPermissionsTab';
import { BrowserPermissionsTab } from './tabs/BrowserPermissionsTab';
import { FileSandboxTab } from './tabs/FileSandboxTab';
import { AiEngineSettingsTab } from './tabs/AiEngineSettingsTab';
import { CommandSettingsTab } from './tabs/CommandSettingsTab';
import { LucideIcon, Palette, Terminal, Globe, ShieldAlert, Cpu, TerminalSquare } from 'lucide-react';
import clsx from 'clsx';

const TABS: Array<{ id: SettingCenterTab; label: string; icon: LucideIcon }> = [
  { id: 'appearance', label: 'Giao Diện & Themes', icon: Palette },
  { id: 'commands', label: 'Command & Folder Rules', icon: TerminalSquare },
  { id: 'terminal', label: 'Quyền Hạn Terminal', icon: Terminal },
  { id: 'browser', label: 'Browser & DOM', icon: Globe },
  { id: 'sandbox', label: 'File Sandbox', icon: ShieldAlert },
  { id: 'ai', label: 'AI Model & Router', icon: Cpu },
];

export const SettingCenterModal: React.FC = () => {
  const { isSettingCenterModalOpen, setSettingCenterModalOpen, resetAgentPermissions, addToast } = useAgentStore();
  const [activeTab, setActiveTab] = useState<SettingCenterTab>('appearance');

  if (!isSettingCenterModalOpen) return null;

  const handleResetDefaults = () => {
    resetAgentPermissions();
    addToast('Đã khôi phục cài đặt về giá trị mặc định chuẩn', 'info');
  };

  const handleClose = () => {
    setSettingCenterModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-modal w-full max-w-3xl max-h-[85vh] rounded-2xl border border-subtle shadow-2xl flex flex-col overflow-hidden select-none">
        <SettingCenterHeader onClose={handleClose} onResetDefaults={handleResetDefaults} />

        {/* Tab Navigation & Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-56 border-r border-subtle surface-card p-3 space-y-1 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                  activeTab === id
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "text-secondary hover:text-primary hover:bg-primary/10"
                )}
              >
                <Icon size={15} className={clsx(activeTab === id ? "text-white" : "text-muted")} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'commands' && <CommandSettingsTab />}
            {activeTab === 'terminal' && <TerminalPermissionsTab />}
            {activeTab === 'browser' && <BrowserPermissionsTab />}
            {activeTab === 'sandbox' && <FileSandboxTab />}
            {activeTab === 'ai' && <AiEngineSettingsTab />}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-subtle surface-header flex items-center justify-between text-xs text-muted shrink-0">
          <span>Tất cả thay đổi được tự động đồng bộ hóa với file <code className="font-mono text-secondary">settings.json</code></span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-md transition-all cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
