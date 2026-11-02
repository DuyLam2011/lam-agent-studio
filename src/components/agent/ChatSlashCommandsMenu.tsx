import React from 'react';
import { SLASH_COMMANDS } from './agentConstants';

interface ChatSlashCommandsMenuProps {
  onSelectCommand: (command: string) => void;
}

export const ChatSlashCommandsMenu: React.FC<ChatSlashCommandsMenuProps> = ({ onSelectCommand }) => {
  return (
    <div className="surface-dropdown p-1.5 space-y-1 mb-2 shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
      {SLASH_COMMANDS.map((cmd) => (
        <button
          key={cmd.command}
          type="button"
          onClick={() => onSelectCommand(cmd.command + ' ')}
          className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-primary text-xs font-semibold">{cmd.command}</span>
            <span className="text-[10px] text-app-muted">{cmd.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
