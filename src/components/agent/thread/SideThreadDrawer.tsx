import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ArrowUpRight, Trash2, Cpu } from 'lucide-react';
import { useSideThreadStore } from '../../../store/useSideThreadStore';
import { MarkdownMessageBody } from '../message/MarkdownMessageBody';
import clsx from 'clsx';

export const SideThreadDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeSideThread,
    rootMessage,
    activeThreadMessageId,
    threads,
    isThinking,
    sendThreadMessage,
    promoteThreadToMainChat,
    clearThread
  } = useSideThreadStore();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentMessages = (activeThreadMessageId && threads[activeThreadMessageId]) || [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentMessages, isThinking]);

  if (!isDrawerOpen || !rootMessage || !activeThreadMessageId) return null;

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    void sendThreadMessage(input);
    setInput('');
  };

  const roleName = rootMessage.agentRole || (rootMessage.role === 'user' ? 'User' : 'Father Agent');

  return (
    <div className="absolute inset-y-0 right-0 w-80 sm:w-96 surface-panel border-l border-primary/30 shadow-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-3 py-2 surface-header flex items-center justify-between gap-1 border-b border-white/5 select-none shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageSquare size={13} className="text-primary shrink-0" />
          <span className="text-xs font-semibold text-app-text truncate">Side Thread</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary shrink-0">
            {roleName}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {currentMessages.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => promoteThreadToMainChat(activeThreadMessageId)}
                className="p-1 rounded text-app-muted hover:text-emerald-400 hover:bg-white/5 transition-colors"
                title="Đưa tóm tắt thảo luận này vào luồng chat chính (Promote)"
              >
                <ArrowUpRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => clearThread(activeThreadMessageId)}
                className="p-1 rounded text-app-muted hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Xóa lịch sử luồng phụ này"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={closeSideThread}
            className="p-1 rounded text-app-muted hover:text-app-text hover:bg-white/5 transition-colors"
            title="Đóng luồng phụ"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Root Anchored Message Card */}
      <div className="p-2.5 mx-2.5 mt-2 rounded-lg bg-black/25 border border-white/10 text-[11px] shrink-0">
        <span className="text-[9.5px] uppercase font-bold tracking-wider text-primary block mb-0.5">
          🎯 Anchored Context:
        </span>
        <div className="text-app-sub line-clamp-3 italic whitespace-pre-wrap select-text">
          "{rootMessage.text.slice(0, 240)}{rootMessage.text.length > 240 ? '...' : ''}"
        </div>
      </div>

      {/* Thread Messages Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 min-h-0">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-app-muted text-xs space-y-1">
            <Cpu size={24} className="text-primary/40 mb-1" />
            <p className="font-semibold text-app-text">Bắt đầu thảo luận tập trung</p>
            <p className="text-[11px]">Hỏi chi tiết hoặc yêu cầu AI làm rõ riêng cho câu trả lời này.</p>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div key={msg.id} className={clsx("flex flex-col space-y-1 text-xs", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={clsx(
                "rounded-xl px-3 py-2 max-w-[90%] leading-relaxed select-text",
                msg.role === 'user' ? "bg-primary text-white" : "surface-card border border-white/10 text-app-text"
              )}>
                <MarkdownMessageBody content={msg.text} />
              </div>
              <span className="text-[9px] font-mono text-gray-500 px-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        {isThinking && (
          <div className="text-[11px] text-primary flex items-center gap-1.5 animate-pulse pl-1">
            <Cpu size={12} />
            <span>AI đang phân tích câu hỏi trong luồng phụ...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2.5 surface-header border-t border-white/5 shrink-0 flex items-center gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Hỏi AI sâu hơn về câu trả lời này..."
          className="flex-1 bg-transparent text-xs text-app-text placeholder-app-muted focus:outline-none min-w-0"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="p-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-40 text-white transition-colors"
          title="Gửi câu hỏi vào luồng phụ"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
};
