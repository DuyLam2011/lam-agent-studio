import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';

export const ChatSessionDropdown: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    switchConversation,
    createConversation,
    deleteConversation,
    getActiveConversation
  } = useConversationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConv = getActiveConversation();
  const currentTitle = activeConv ? activeConv.title : 'New Chat';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNewChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    createConversation('New Chat');
    setIsOpen(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="surface-card flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-app-text hover:text-primary transition-all max-w-[140px]"
        title={`Session: ${currentTitle}`}
      >
        <MessageSquare size={12} className="text-purple-400 shrink-0" />
        <span className="truncate font-medium">{currentTitle}</span>
        <ChevronDown size={11} className="text-app-muted shrink-0" />
      </button>

      <button
        onClick={handleNewChat}
        className="surface-card p-1 rounded-lg text-app-sub hover:text-primary transition-colors"
        title="Start New Chat Session"
      >
        <Plus size={13} />
      </button>

      {isOpen && (
        <div className="surface-panel absolute top-full left-0 mt-1 w-64 max-h-72 overflow-y-auto custom-scrollbar p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-app-muted uppercase tracking-wider border-b border-border mb-1">
            <span>Chat Sessions</span>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 text-primary hover:text-primary-foreground font-normal lowercase tracking-normal"
            >
              <Plus size={11} />
              <span>new</span>
            </button>
          </div>

          {conversations.map((c) => {
            const isSelected = c.id === activeConversationId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  switchConversation(c.id);
                  setIsOpen(false);
                }}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-white/10 text-app-sub hover:text-app-text'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {isSelected ? <Check size={12} className="text-primary shrink-0" /> : <MessageSquare size={12} className="opacity-40 shrink-0" />}
                  <div className="truncate">
                    <div className="truncate font-medium text-xs text-app-text">{c.title}</div>
                    <div className="text-[10px] text-app-muted font-mono">
                      {c.messages.length} msgs · {formatTime(c.updatedAt)}
                    </div>
                  </div>
                </div>

                {conversations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all shrink-0"
                    title="Delete session"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
