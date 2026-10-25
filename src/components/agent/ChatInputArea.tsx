import React, { useState, useRef } from 'react';
import { Send, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useAgentStore } from '../../store/useAgentStore';
import { SLASH_COMMANDS } from './agentConstants';
import { ChatContextBar } from './context/ChatContextBar';
import { useMentionAutocomplete } from './mention/useMentionAutocomplete';
import { MentionDropdown } from './mention/MentionDropdown';
import { MentionItem } from '../../types/mention';

interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, isThinking }) => {
  const { engineSettings } = useAgentStore();
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isOpen: isMentionOpen, setIsOpen: setMentionOpen,
    selectedIndex, setSelectedIndex, filteredItems,
    handleTextChange, applySelection
  } = useMentionAutocomplete();

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
    setShowCommands(false);
    setMentionOpen(false);
  };

  const handleSelectMention = async (item: MentionItem) => {
    const cursorPos = textareaRef.current?.selectionStart || input.length;
    const res = await applySelection(item, input, cursorPos);
    setInput(res.updatedText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = res.newCursorPos;
        textareaRef.current.focus();
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentionOpen && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        return setSelectedIndex((selectedIndex + 1) % filteredItems.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        return setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length);
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        return handleSelectMention(filteredItems[selectedIndex]);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        return setMentionOpen(false);
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    handleTextChange(e.target.value, e.target.selectionStart || e.target.value.length);
  };

  return (
    <div className="p-3 surface-header space-y-2 shrink-0 relative">
      <ChatContextBar showCommands={showCommands} setShowCommands={setShowCommands} />

      {isMentionOpen && (
        <MentionDropdown
          items={filteredItems}
          selectedIndex={selectedIndex}
          onSelect={handleSelectMention}
          onClose={() => setMentionOpen(false)}
        />
      )}

      {showCommands && (
        <div className="surface-panel p-1.5 space-y-1 mb-2 rounded-xl border border-border shadow-xl">
          {SLASH_COMMANDS.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => { setInput(cmd.command + ' '); setShowCommands(false); }}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-primary text-xs font-semibold">{cmd.command}</span>
                <span className="text-[10px] text-app-muted">{cmd.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI or type @ to mention files, @git, @terminal..."
          className="w-full surface-input rounded-xl py-2 pl-3 pr-10 text-xs placeholder-app-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none h-14 custom-scrollbar"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className={clsx(
            "absolute right-2 bottom-2 p-1.5 rounded-lg text-white transition-all shadow-md",
            engineSettings.mode === 'vibe'
              ? "bg-gradient-to-r from-primary to-indigo-600 hover:brightness-110 disabled:opacity-40"
              : "bg-white/10 hover:bg-white/20 disabled:opacity-40"
          )}
          title="Send Prompt (Enter)"
        >
          {engineSettings.mode === 'vibe' ? <Zap size={14} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
};
