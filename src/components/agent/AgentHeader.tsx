import React from 'react';
import { Settings2, Bot, Key, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { AgentModelDropdown } from './AgentModelDropdown';
import { ChatWorkspaceSelector } from './ChatWorkspaceSelector';
import { ChatSessionDropdown } from './ChatSessionDropdown';
import { ChatSecurityModeSelector } from './ChatSecurityModeSelector';

interface AgentHeaderProps {
  onToggleSettings?: () => void;
  isSettingsOpen?: boolean;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ onToggleSettings, isSettingsOpen }) => {
  const { engineSettings, clearChatMessages, addToast, setAgentsCenterOpen, setOllamaModalOpen } = useAgentStore();
  const { syncCurrentMessages } = useConversationStore();

  const handleClearChat = () => {
    clearChatMessages();
    syncCurrentMessages([]);
    addToast('Conversation cleared', 'info');
  };

  return (
    <div className="surface-header flex flex-col gap-1.5 p-2 shrink-0 select-none">
      {/* Top Controls: Workspace, Chat Session & Security Mode */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ChatWorkspaceSelector />
          <ChatSessionDropdown />
        </div>
        <ChatSecurityModeSelector />
      </div>

      {/* Bottom Controls: Model Dropdown, Provider Key, Agents Center & Settings */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <AgentModelDropdown />
          <button
            onClick={() => setOllamaModalOpen(true)}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all shrink-0",
              engineSettings.customApiKey || engineSettings.provider === 'ollama'
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            )}
            title="Configure API Key & Cloud Provider"
          >
            <Key size={10} />
            <span>{engineSettings.customApiKey ? (engineSettings.provider === 'gemini' ? 'Gemini' : 'AI') : 'Key'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setAgentsCenterOpen(true)}
            className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
            title="Agents Center (Rules, Skills & Repos)"
          >
            <Bot size={13} />
          </button>

          {onToggleSettings && (
            <button
              onClick={onToggleSettings}
              className={clsx(
                "p-1.5 rounded-lg border transition-colors",
                isSettingsOpen
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "surface-card text-app-sub hover:text-app-text"
              )}
              title="Configure Engine Settings"
            >
              <Settings2 size={13} />
            </button>
          )}

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-lg surface-card hover:bg-rose-500/20 text-app-sub hover:text-rose-400 transition-colors"
            title="Clear Current Chat"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
