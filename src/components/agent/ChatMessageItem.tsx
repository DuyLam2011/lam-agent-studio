import React, { useState } from 'react';
import { CircleStop, AlertTriangle, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { AgentAvatar } from './avatar/AgentAvatar';
import { AGENT_VISUAL_REGISTRY, AgentRoleType } from '../../types/avatar';
import { ChatMessageDiffBanner } from './message/ChatMessageDiffBanner';
import { MarkdownMessageBody } from './message/MarkdownMessageBody';
import { AgentRunTimeline } from './message/AgentRunTimeline';
import { StreamingCaret } from './message/ThinkingBlock';
import { ChatMessageFooterActions } from './message/ChatMessageFooterActions';
import { ChatMessageGovernanceBar } from './message/ChatMessageGovernanceBar';
import { ChatMessageClarificationSection } from './message/ChatMessageClarificationSection';
import { sendChatMessage } from '../../services/agent-chat/agentRunService';

const resolveRole = (message: ChatMessage): AgentRoleType => {
  if (message.role === 'user') return 'user';
  if (message.agentRole && message.agentRole in AGENT_VISUAL_REGISTRY) return message.agentRole as AgentRoleType;
  const hasDiffTools = message.toolCalls?.some((tc) => ['write_file', 'edit_file', 'patch_file'].includes(tc.name)) ||
    (message.diffSnapshots && message.diffSnapshots.length > 0);
  const hasCommandTools = message.toolCalls?.some((tc) => tc.name === 'run_command');
  return hasCommandTools && !hasDiffTools ? 'subagent-log-analyzer' : 'lead-architect';
};

const formatSeconds = (ms?: number) => (ms ? `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s` : null);

const ChatMessageItemBase: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isBodyCollapsed, setIsBodyCollapsed] = useState(false);
  const isUser = message.role === 'user';
  const isLive = message.status === 'streaming';
  const activeRole = resolveRole(message);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRerunPrompt = () => {
    if (isUser) return void sendChatMessage(message.text);
    const msgs = useAgentStore.getState().chatMessages;
    const idx = msgs.findIndex((m) => m.id === message.id);
    for (let i = (idx >= 0 ? idx : msgs.length) - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && msgs[i].text) return void sendChatMessage(msgs[i].text);
    }
  };

  const meta = [message.model, formatSeconds(message.durationMs)].filter(Boolean).join(' · ');

  return (
    <div className={clsx('flex gap-2.5 my-2.5 group items-start', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className="w-8 shrink-0 flex justify-center pt-0.5">
        <AgentAvatar role={activeRole} size="md" showStatusDot={!isUser} showTooltip={true} />
      </div>

      <div className={clsx(
        'max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2 relative border min-w-0 transition-all',
        isUser ? 'bg-primary/20 border-primary/30 text-app-text shadow-sm' : 'surface-card text-app-text shadow-md',
        !isUser && isLive && 'w-full'
      )}>
        {!isUser && (
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <AgentRunTimeline message={message} isLive={isLive} />
            </div>
            {!isLive && message.text && (
              <button
                type="button"
                onClick={() => setIsBodyCollapsed(!isBodyCollapsed)}
                className="p-1 text-app-muted hover:text-app-text rounded transition-colors shrink-0"
                title={isBodyCollapsed ? "Mở rộng nội dung phản hồi" : "Thu gọn nội dung phản hồi"}
              >
                {isBodyCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>
        )}

        {!isUser && !isBodyCollapsed && <ChatMessageGovernanceBar message={message} />}

        {isUser ? (
          <div className="whitespace-pre-wrap select-text font-normal text-app-text text-[12.5px] leading-relaxed">{message.text}</div>
        ) : isBodyCollapsed ? (
          <button
            type="button"
            onClick={() => setIsBodyCollapsed(false)}
            className="text-[11px] text-app-muted hover:text-app-text italic py-0.5 flex items-center gap-1.5 cursor-pointer text-left"
          >
            <ChevronRight size={11} className="text-primary shrink-0" />
            <span>Nội dung phản hồi đã thu gọn. Bấm để mở rộng.</span>
          </button>
        ) : message.text ? (
          <div>
            <MarkdownMessageBody content={message.text} />
            {isLive && <StreamingCaret />}
          </div>
        ) : null}

        {message.status === 'cancelled' && (
          <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300/90">
            <CircleStop size={11} /> {message.error || 'Stopped before completion'}
          </div>
        )}
        {message.status === 'failed' && message.error && (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10.5px] text-rose-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle size={12} className="shrink-0 text-rose-400" />
              <span className="truncate">{message.error}</span>
            </div>
            <button
              type="button"
              onClick={handleRerunPrompt}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-medium shrink-0 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={10} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {!isUser && !isLive && !isBodyCollapsed && <ChatMessageDiffBanner message={message} />}
        {!isUser && !isLive && !isBodyCollapsed && <ChatMessageClarificationSection message={message} />}

        {!isLive && (
          <ChatMessageFooterActions
            message={message}
            meta={meta}
            isUser={isUser}
            onCopy={handleCopyText}
            copied={copied}
            onRerun={handleRerunPrompt}
          />
        )}
      </div>
    </div>
  );
};

export const ChatMessageItem = React.memo(ChatMessageItemBase);
