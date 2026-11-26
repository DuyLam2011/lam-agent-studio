import React from 'react';
import { Copy, Check, RotateCcw, GitFork, Quote, MessageSquare } from 'lucide-react';
import { ChatMessage, useAgentStore } from '../../../store/useAgentStore';
import { useConversationStore } from '../../../store/useConversationStore';
import { useSideThreadStore } from '../../../store/useSideThreadStore';
import { formatQuotePrompt } from '../../../services/agent-chat/chatExportService';

interface ChatMessageFooterActionsProps {
  message: ChatMessage;
  meta: string;
  isUser: boolean;
  onCopy: () => void;
  copied: boolean;
  onRerun: () => void;
}

export const ChatMessageFooterActions: React.FC<ChatMessageFooterActionsProps> = ({
  message,
  meta,
  isUser,
  onCopy,
  copied,
  onRerun
}) => {
  const { setPendingChatPrompt } = useAgentStore();
  const { forkConversationFromMessage } = useConversationStore();
  const { openSideThread, getThreadMessageCount } = useSideThreadStore();
  const threadCount = getThreadMessageCount(message.id);

  const handleQuote = () => {
    const quote = formatQuotePrompt(message);
    setPendingChatPrompt(quote);
  };

  const handleFork = () => {
    forkConversationFromMessage(message.id);
  };

  return (
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-subtle opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-[9.5px] font-mono text-app-muted truncate">{!isUser ? meta : ''}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => openSideThread(message)}
          className="text-[10px] text-app-muted hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
          title="Start side thread focused on this response"
        >
          <MessageSquare size={10} />
          <span className="hidden sm:inline">Thread</span>
          {threadCount > 0 && (
            <span className="px-1 rounded-full bg-primary/15 text-primary text-[9px] font-mono">
              {threadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleQuote}
          className="text-[10px] text-app-muted hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
          title="Quote this message in chat input"
        >
          <Quote size={10} />
          <span className="hidden sm:inline">Quote</span>
        </button>

        <button
          type="button"
          onClick={handleFork}
          className="text-[10px] text-app-muted hover:text-emerald-500 flex items-center gap-1 transition-colors cursor-pointer"
          title="Branch new conversation from here"
        >
          <GitFork size={10} />
          <span className="hidden sm:inline">Fork</span>
        </button>

        <button
          type="button"
          onClick={onRerun}
          className="text-[10px] text-app-muted hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
          title={isUser ? "Rerun this prompt" : "Rerun previous prompt"}
        >
          <RotateCcw size={10} />
          <span>{isUser ? 'Rerun' : 'Prompt'}</span>
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="text-[10px] text-app-muted hover:text-app-text flex items-center gap-1 transition-colors cursor-pointer"
          title="Copy message content"
        >
          {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
