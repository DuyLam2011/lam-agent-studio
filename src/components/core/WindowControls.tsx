import React from 'react';
import { Minus, Square, X, UserCircle2, ShieldCheck, Key } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

interface WindowControlsProps {
  onOpenSecurityModal: () => void;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ onOpenSecurityModal }) => {
  const {
    setAccountModalOpen, isAccountModalOpen, githubUser,
    engineSettings, setOllamaModalOpen
  } = useAgentStore();

  return (
    <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex h-full m-0 p-0 items-center">
      <button
        onClick={() => setOllamaModalOpen(true)}
        className={clsx(
          "h-full px-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-white/5 text-xs",
          engineSettings.customApiKey || engineSettings.provider === 'ollama'
            ? "text-cyan-400 hover:text-white hover:bg-cyan-500/20"
            : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 animate-pulse font-bold"
        )}
        title="Connect AI Agent: Google Gemini, OpenAI, DeepSeek, or Local Ollama"
      >
        <Key size={12} className={engineSettings.customApiKey ? "text-cyan-400" : "text-amber-400"} />
        <span className="text-[11px] font-semibold">
          {engineSettings.customApiKey ? (engineSettings.provider === 'gemini' ? 'Gemini AI' : (engineSettings.provider?.toUpperCase() || 'Cloud AI')) : 'Configure AI Key'}
        </span>
      </button>

      <button
        onClick={onOpenSecurityModal}
        className="h-full px-2.5 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer border-r border-white/5 text-xs text-emerald-400 hover:text-white hover:bg-emerald-500/20"
        title="AI Security & Harness Inspector"
      >
        <ShieldCheck size={13} className="text-emerald-400" />
        <span className="text-[11px] font-semibold text-emerald-300">Harness</span>
      </button>

      <button
        onClick={() => setAccountModalOpen(true)}
        className={`h-full px-4 transition-colors flex items-center justify-center rounded-none cursor-pointer border-r border-white/5 ${isAccountModalOpen ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
        title="Account Center"
      >
        {githubUser ? <img src={githubUser.avatar_url} alt={githubUser.login} className="w-4 h-4 rounded-full object-cover" /> : <UserCircle2 size={16} />}
      </button>

      {/* @ts-ignore */}
      <button onClick={() => window.lamApi?.minimizeWindow?.()} className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white">
        <Minus size={14} />
      </button>
      {/* @ts-ignore */}
      <button onClick={() => window.lamApi?.maximizeWindow?.()} className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white">
        <Square size={12} />
      </button>
      {/* @ts-ignore */}
      <button onClick={() => window.lamApi?.closeWindow?.()} className="h-full px-4 hover:bg-red-500 transition-colors flex items-center justify-center text-gray-400 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};
