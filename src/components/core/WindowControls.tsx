import React from 'react';
import { Minus, Square, X, UserCircle2, ShieldCheck, Key, Settings } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

interface WindowControlsProps {
  onOpenSecurityModal: () => void;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ onOpenSecurityModal }) => {
  const {
    setAccountModalOpen, isAccountModalOpen, githubUser,
    isSettingCenterModalOpen, setSettingCenterModalOpen,
    engineSettings, setOllamaModalOpen
  } = useAgentStore();

  const isConfigured = Boolean(engineSettings.customApiKey || engineSettings.provider === 'ollama');

  return (
    <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex h-full m-0 p-0 items-center">
      <button
        onClick={() => setOllamaModalOpen(true)}
        className={clsx(
          "h-full px-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-border text-xs",
          isConfigured
            ? "text-primary hover:bg-primary/10"
            : "text-app-muted hover:text-app-text hover:bg-white/5"
        )}
        title="Connect AI Agent: Google Gemini, OpenAI, DeepSeek, or Local Ollama"
      >
        <Key size={12} className={isConfigured ? "text-primary" : "text-app-muted"} />
        <span className="text-[11px] font-medium hidden lg:inline">
          {engineSettings.customApiKey ? (engineSettings.provider === 'gemini' ? 'Gemini AI' : (engineSettings.provider?.toUpperCase() || 'AI')) : 'Key'}
        </span>
      </button>

      <button
        onClick={onOpenSecurityModal}
        className="h-full px-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-border text-xs text-app-muted hover:text-app-text hover:bg-white/5"
        title="AI Security & Sandboxing Harness"
      >
        <ShieldCheck size={13} className="text-primary" />
        <span className="text-[11px] font-medium hidden lg:inline">Harness</span>
      </button>

      <button
        onClick={() => setAccountModalOpen(true)}
        className={clsx(
          "h-full px-3 transition-colors flex items-center justify-center rounded-none cursor-pointer border-r border-border",
          isAccountModalOpen ? "text-primary bg-primary/10" : "text-app-muted hover:text-app-text hover:bg-white/5"
        )}
        title="Account Center"
      >
        {githubUser ? <img src={githubUser.avatar_url} alt={githubUser.login} className="w-4 h-4 rounded-full object-cover" /> : <UserCircle2 size={15} />}
      </button>

      <button
        onClick={() => setSettingCenterModalOpen(true)}
        className={clsx(
          "h-full px-3 transition-colors flex items-center justify-center rounded-none cursor-pointer border-r border-border text-xs",
          isSettingCenterModalOpen ? "text-primary bg-primary/10" : "text-app-muted hover:text-app-text hover:bg-white/5"
        )}
        title="Setting Center (Appearance, Terminal Permissions, Browser & Sandboxing)"
      >
        <Settings size={14} className={clsx(isSettingCenterModalOpen ? "text-primary rotate-45 transition-transform" : "transition-transform")} />
      </button>

      {/* @ts-ignore */}
      <button onClick={() => window.lamApi?.minimizeWindow?.()} className="h-full px-3.5 hover:bg-white/10 transition-colors flex items-center justify-center text-app-muted hover:text-app-text">
        <Minus size={13} />
      </button>
      {/* @ts-ignore */}
      <button onClick={() => window.lamApi?.maximizeWindow?.()} className="h-full px-3.5 hover:bg-white/10 transition-colors flex items-center justify-center text-app-muted hover:text-app-text">
        <Square size={11} />
      </button>
      {/* @ts-ignore */}
      <button onClick={() => window.lamApi?.closeWindow?.()} className="h-full px-3.5 hover:bg-rose-600 transition-colors flex items-center justify-center text-app-muted hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
};
