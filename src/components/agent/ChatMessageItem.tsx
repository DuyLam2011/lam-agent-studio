import React, { useState } from 'react';
import { Bot, User, Brain, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage } from '../../store/useAgentStore';
import { ToolCallCard } from './ToolCallCard';

export const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const [showThinking, setShowThinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <div className={clsx("flex gap-2.5 my-2 group", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={clsx(
        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-md border",
        isUser ? "bg-primary/20 border-primary/30 text-primary" : "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
      )}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble Content */}
      <div className={clsx(
        "max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2 relative border",
        isUser
          ? "bg-gradient-to-br from-primary/30 to-indigo-600/20 border-primary/30 text-blue-50 shadow-lg"
          : "bg-white/5 border-white/10 text-gray-200 shadow-xl backdrop-blur-md"
      )}>
        {/* Thinking Accordion for Reasoning Models */}
        {message.thinking && (
          <div className="rounded-lg bg-black/40 border border-purple-500/20 overflow-hidden">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-mono text-purple-300 hover:bg-purple-500/10 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Brain size={12} className="text-purple-400" />
                Thinking Process
              </span>
              <span className="text-[9px] text-gray-500">{showThinking ? 'Hide' : 'Show details'}</span>
            </button>
            {showThinking && (
              <div className="p-2 border-t border-purple-500/10 text-[11px] text-gray-400 font-mono whitespace-pre-wrap leading-normal bg-black/60 max-h-48 overflow-y-auto custom-scrollbar">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Tool Call Cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Legacy single toolCall */}
        {message.toolCall && !message.toolCalls && (
          <ToolCallCard
            toolCall={{
              id: 'legacy-tc',
              name: message.toolCall.name,
              args: message.toolCall.args,
              status: 'success',
              result: message.toolCall.result,
              autoApproved: true,
            }}
          />
        )}

        {/* Message Main Body */}
        <div className="whitespace-pre-wrap select-text font-normal text-gray-200">
          {message.text}
        </div>

        {/* Action footer */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopyText}
            className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            title="Copy message"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
