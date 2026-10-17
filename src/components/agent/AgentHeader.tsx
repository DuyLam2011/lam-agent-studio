import React, { useState } from 'react';
import { Cpu, Zap, MessageSquare, Trash2, ChevronDown, Check, Settings2, Bot } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore } from '../../store/useAgentStore';
import { AVAILABLE_MODELS } from './agentConstants';

interface AgentHeaderProps {
  onToggleSettings?: () => void;
  isSettingsOpen?: boolean;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ onToggleSettings, isSettingsOpen }) => {
  const { engineSettings, updateEngineSettings, clearChatMessages, addToast, setAgentsCenterOpen } = useAgentStore();
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === engineSettings.selectedModel) || AVAILABLE_MODELS[0];

  const handleToggleMode = () => {
    const nextMode = engineSettings.mode === 'vibe' ? 'chat' : 'vibe';
    updateEngineSettings({ mode: nextMode });
    addToast(`Mode: ${nextMode.toUpperCase()}`, 'info');
  };

  const handleClearChat = () => {
    clearChatMessages();
    addToast('Conversation cleared', 'info');
  };

  return (
    <div className="px-3 py-2 border-b border-white/10 bg-black/40 flex items-center justify-between gap-2 shrink-0">
      {/* Model Picker Pill */}
      <div className="relative">
        <button
          onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 transition-colors"
          title="Select AI Model"
        >
          <Cpu size={12} className="text-primary shrink-0" />
          <span className="font-medium text-[11px] truncate max-w-[110px]">{selectedModel.name}</span>
          <ChevronDown size={11} className="text-gray-400 shrink-0" />
        </button>

        {modelDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-neutral-900 border border-white/15 rounded-xl shadow-2xl py-1 backdrop-blur-xl">
            <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-gray-400 font-semibold border-b border-white/5">
              Available Models
            </div>
            <div className="max-h-52 overflow-y-auto custom-scrollbar">
              {AVAILABLE_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    updateEngineSettings({ selectedModel: m.id });
                    setModelDropdownOpen(false);
                    addToast(`Model: ${m.name}`, 'success');
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors",
                    engineSettings.selectedModel === m.id ? "bg-primary/20 text-white" : "text-gray-300 hover:bg-white/5"
                  )}
                >
                  <div className="flex flex-col truncate">
                    <span className="font-medium text-[11px] truncate">{m.name}</span>
                    <span className="text-[9px] text-gray-500 font-mono">{m.provider}</span>
                  </div>
                  {engineSettings.selectedModel === m.id && <Check size={12} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mode Switch & Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleToggleMode}
          className={clsx(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border",
            engineSettings.mode === 'vibe'
              ? "bg-gradient-to-r from-primary to-indigo-600 text-white border-primary/50 shadow"
              : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
          )}
          title={engineSettings.mode === 'vibe' ? "Vibe Coder (Autonomous Agent Mode)" : "Chat (Ask Mode)"}
        >
          {engineSettings.mode === 'vibe' ? <Zap size={11} /> : <MessageSquare size={11} />}
          <span>{engineSettings.mode === 'vibe' ? 'Vibe' : 'Chat'}</span>
        </button>

        <button
          onClick={() => setAgentsCenterOpen(true)}
          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
          title="Agents Center (Rules, Skills & Workspaces)"
        >
          <Bot size={13} />
        </button>

        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            className={clsx(
              "p-1.5 rounded-lg border transition-colors",
              isSettingsOpen ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-gray-400 hover:text-white border-white/10 hover:bg-white/10"
            )}
            title="Configure Model & Skills"
          >
            <Settings2 size={13} />
          </button>
        )}

        <button
          onClick={handleClearChat}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 transition-colors"
          title="Clear Session"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
