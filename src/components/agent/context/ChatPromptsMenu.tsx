import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Terminal, FileCode, Bot, ChevronUp } from 'lucide-react';
import { ChatPromptsMenuList } from './ChatPromptsMenuList';
import clsx from 'clsx';

interface ChatPromptsMenuProps {
  onInsertPrompt: (text: string) => void;
}

export const ChatPromptsMenu: React.FC<ChatPromptsMenuProps> = ({ onInsertPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'prompts' | 'commands' | 'subagents'>('prompts');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (text: string) => {
    onInsertPrompt(text);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all select-none",
          isOpen
            ? "bg-primary text-white border-primary shadow-sm"
            : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
        )}
        title="Prompts, Slash Commands & Subagent Routing"
      >
        <Sparkles size={11} className={isOpen ? "text-white" : "text-amber-400"} />
        <span>Prompts</span>
        <ChevronUp size={10} className={clsx("transition-transform", !isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="surface-dropdown absolute bottom-full left-0 mb-1.5 w-72 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5 mb-1.5">
            <button
              type="button"
              onClick={() => setTab('prompts')}
              className={clsx(
                "flex-1 py-1 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1",
                tab === 'prompts' ? "bg-primary text-white shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              <FileCode size={10} /> <span>Templates</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('commands')}
              className={clsx(
                "flex-1 py-1 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1",
                tab === 'commands' ? "bg-primary text-white shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              <Terminal size={10} /> <span>/Commands</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('subagents')}
              className={clsx(
                "flex-1 py-1 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1",
                tab === 'subagents' ? "bg-primary text-white shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              <Bot size={10} /> <span>Subagents</span>
            </button>
          </div>

          <ChatPromptsMenuList tab={tab} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
};
