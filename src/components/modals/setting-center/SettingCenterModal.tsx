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
import { VendorUpdatesTab } from './tabs/VendorUpdatesTab';
import { LucideIcon, Palette, Terminal, Globe, ShieldAlert, Cpu, TerminalSquare, Download } from 'lucide-react';
import clsx from 'clsx';

const TABS: Array<{ id: SettingCenterTab; label: string; icon: LucideIcon }> = [
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette },
  { id: 'commands', label: 'Command & Folder Rules', icon: TerminalSquare },
  { id: 'terminal', label: 'Terminal Permissions', icon: Terminal },
  { id: 'browser', label: 'Browser & DOM', icon: Globe },
  { id: 'sandbox', label: 'File Sandbox', icon: ShieldAlert },
  { id: 'ai', label: 'AI Model & Router', icon: Cpu },
  { id: 'updates', label: 'Vendor Updates & Sync', icon: Download },
];

export const SettingCenterModal: React.FC = () => {
  const { isSettingCenterModalOpen, setSettingCenterModalOpen, resetAgentPermissions, addToast } = useAgentStore();
  const [activeTab, setActiveTab] = useState<SettingCenterTab>('appearance');

  if (!isSettingCenterModalOpen) return null;

  const handleResetDefaults = () => {
    resetAgentPermissions();
    addToast('Restored settings to default standard values', 'info');
  };

  const handleClose = () => {
    setSettingCenterModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="surface-modal w-[min(920px,95vw)] h-[min(720px,88vh)] rounded-2xl border border-subtle shadow-2xl flex flex-col overflow-hidden select-none">
        <SettingCenterHeader onClose={handleClose} onResetDefaults={handleResetDefaults} />

        {/* Tab Navigation & Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Responsive Navigation Sidebar / Strip */}
          <div className="md:w-56 border-b md:border-b-0 md:border-r border-subtle surface-card p-2 sm:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 md:w-full",
                  activeTab === id
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "text-secondary hover:text-primary hover:bg-primary/10"
                )}
              >
                <Icon size={15} className={clsx(activeTab === id ? "text-white" : "text-muted")} />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'commands' && <CommandSettingsTab />}
            {activeTab === 'terminal' && <TerminalPermissionsTab />}
            {activeTab === 'browser' && <BrowserPermissionsTab />}
            {activeTab === 'sandbox' && <FileSandboxTab />}
            {activeTab === 'ai' && <AiEngineSettingsTab />}
            {activeTab === 'updates' && <VendorUpdatesTab />}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-subtle surface-header flex items-center justify-between text-xs text-muted shrink-0">
          <span>All changes are automatically synchronized with <code className="font-mono text-secondary">settings.json</code></span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-md transition-all cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
