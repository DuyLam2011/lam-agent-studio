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
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-[9.5px] font-mono text-app-muted truncate">{!isUser ? meta : ''}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => openSideThread(message)}
          className="text-[10px] text-gray-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          title="Bắt đầu luồng thảo luận phụ tập trung vào câu trả lời này"
        >
          <MessageSquare size={10} />
          <span className="hidden sm:inline">Luồng phụ</span>
          {threadCount > 0 && (
            <span className="px-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">
              {threadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleQuote}
          className="text-[10px] text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
          title="Trích dẫn nội dung tin nhắn này vào khung chat"
        >
          <Quote size={10} />
          <span className="hidden sm:inline">Trích dẫn</span>
        </button>

        <button
          type="button"
          onClick={handleFork}
          className="text-[10px] text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          title="Tạo nhánh chat mới từ điểm này (Branch conversation)"
        >
          <GitFork size={10} />
          <span className="hidden sm:inline">Nhánh mới</span>
        </button>

        <button
          type="button"
          onClick={onRerun}
          className="text-[10px] text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
          title={isUser ? "Chạy lại câu prompt này" : "Chạy lại câu prompt trước đó"}
        >
          <RotateCcw size={10} />
          <span>{isUser ? 'Chạy lại' : 'Prompt'}</span>
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          title="Sao chép nội dung"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
