import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { useMentionAutocomplete } from './mention/useMentionAutocomplete';
import { MentionDropdown } from './mention/MentionDropdown';
import { MentionItem } from '../../types/mention';
import { ChatContextTray } from './context/ChatContextTray';
import { ChatInputActionBar } from './context/ChatInputActionBar';

interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  onStop?: () => void;
  isThinking: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, onStop, isThinking }) => {
  const { pendingChatPrompt, setPendingChatPrompt } = useAgentStore();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (pendingChatPrompt && !isThinking) {
      const promptToSend = pendingChatPrompt;
      setPendingChatPrompt(null);
      onSendMessage(promptToSend);
    }
  }, [pendingChatPrompt, isThinking, onSendMessage, setPendingChatPrompt]);

  const {
    isOpen: isMentionOpen, setIsOpen: setMentionOpen,
    selectedIndex, setSelectedIndex, filteredItems,
    handleTextChange, applySelection
  } = useMentionAutocomplete();

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
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
      if (e.key === 'ArrowDown') { e.preventDefault(); return setSelectedIndex((selectedIndex + 1) % filteredItems.length); }
      if (e.key === 'ArrowUp') { e.preventDefault(); return setSelectedIndex((selectedIndex - 1 + filteredItems.length) % filteredItems.length); }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); return handleSelectMention(filteredItems[selectedIndex]); }
      if (e.key === 'Escape') { e.preventDefault(); return setMentionOpen(false); }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertPrompt = (text: string) => {
    setInput((prev) => (prev ? `${prev}\n${text}` : text));
    textareaRef.current?.focus();
  };

  return (
    <div className="p-2.5 surface-header space-y-1.5 shrink-0 relative">
      <ChatContextTray />

      {isMentionOpen && (
        <MentionDropdown
          items={filteredItems}
          selectedIndex={selectedIndex}
          onSelect={handleSelectMention}
          onClose={() => setMentionOpen(false)}
        />
      )}

      {/* Unified Ergonomic Input Container */}
      <div className="surface-card rounded-xl border border-white/10 p-2 shadow-lg focus-within:border-primary/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTextChange(e.target.value, e.target.selectionStart || e.target.value.length);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isThinking ? 'Agent is working… draft your next message' : 'Ask AI, type @ to mention files, git, terminal...'}
          className="w-full bg-transparent text-xs text-app-text placeholder-app-muted focus:outline-none resize-none h-14 custom-scrollbar"
        />

        <ChatInputActionBar
          onInsertPrompt={handleInsertPrompt}
          onSendMessage={handleSend}
          onStop={onStop}
          isThinking={isThinking}
          hasInput={Boolean(input.trim())}
        />
      </div>
    </div>
  );
};
