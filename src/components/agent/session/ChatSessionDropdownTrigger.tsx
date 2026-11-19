import React from 'react';
import { MessageSquare, Plus, ChevronDown, Star } from 'lucide-react';

interface ChatSessionDropdownTriggerProps {
  currentTitle: string;
  isFavorite?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleFavorite: () => void;
  onNewChat: () => void;
}

export const ChatSessionDropdownTrigger: React.FC<ChatSessionDropdownTriggerProps> = ({
  currentTitle,
  isFavorite,
  isOpen,
  onToggleOpen,
  onToggleFavorite,
  onNewChat,
}) => {
  return (
    <>
      <button
        onClick={onToggleOpen}
        className={`surface-card flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-app-text hover:text-primary transition-all max-w-[160px] ${
          isOpen ? 'border-primary/40 text-primary' : ''
        }`}
        title={`Session: ${currentTitle} (Click to switch or rename)`}
      >
        {isFavorite ? (
          <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
        ) : (
          <MessageSquare size={12} className="text-purple-400 shrink-0" />
        )}
        <span className="truncate font-medium">{currentTitle}</span>
        <ChevronDown size={11} className={`text-app-muted shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`surface-card p-1 rounded-lg transition-colors ${
          isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-app-sub hover:text-amber-400'
        }`}
        title={isFavorite ? 'Remove active chat from favorites' : 'Star active chat'}
      >
        <Star size={13} className={isFavorite ? 'fill-amber-400' : ''} />
      </button>

      <button
        onClick={onNewChat}
        className="surface-card p-1 rounded-lg text-app-sub hover:text-primary transition-colors"
        title="Start New Chat Session"
      >
        <Plus size={13} />
      </button>
    </>
  );
};
