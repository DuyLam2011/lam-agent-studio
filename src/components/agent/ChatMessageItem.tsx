import React, { useState } from 'react';
import { CircleStop, AlertTriangle, ChevronDown, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { AgentAvatar } from './avatar/AgentAvatar';
import { AGENT_VISUAL_REGISTRY, AgentRoleType } from '../../types/avatar';
import { ChatMessageDiffBanner } from './message/ChatMessageDiffBanner';
import { MarkdownMessageBody } from './message/MarkdownMessageBody';
import { AgentRunTimeline } from './message/AgentRunTimeline';
import { StreamingCaret } from './message/ThinkingBlock';
import { AgentThinkingIndicator } from './message/AgentThinkingIndicator';
import { ChatMessageFooterActions } from './message/ChatMessageFooterActions';
import { ChatMessageGovernanceBar } from './message/ChatMessageGovernanceBar';
import { ChatMessageClarificationSection } from './message/ChatMessageClarificationSection';
import { ChatMessageDelegationSection } from './delegation/ChatMessageDelegationSection';
import { sendChatMessage } from '../../services/agent-chat/agentRunService';

const resolveRole = (message: ChatMessage): AgentRoleType => {
  if (message.role === 'user') return 'user';
  const role = message.agentRole || '';
  if (role in AGENT_VISUAL_REGISTRY) return role as AgentRoleType;
  if (/planner|strategy/i.test(role)) return 'subagent-task-planner';
  if (/executor|coder|implement/i.test(role)) return 'subagent-code-executor';
  if (/backend|review/i.test(role)) return 'subagent-backend-reviewer';
  if (/security|guard|sentry/i.test(role)) return 'subagent-security-harness';
  if (/qa|diff|test/i.test(role)) return 'subagent-qa-reviewer';
  if (/log|diag|watchdog/i.test(role)) return 'subagent-log-analyzer';
  if (/ui|design|ux/i.test(role)) return 'subagent-ui-inspector';
  if (/browser/i.test(role)) return 'subagent-browser-inspector';
  if (/analytic|readdoc|webdoc/i.test(role)) return 'subagent-web-doc-analytic';
  if (/mcp/i.test(role)) return 'subagent-mcp-bridge';
  const hasDiffTools = message.toolCalls?.some((tc) => ['write_file', 'edit_file', 'patch_file'].includes(tc.name)) || (message.diffSnapshots && message.diffSnapshots.length > 0);
  return message.toolCalls?.some((tc) => tc.name === 'run_command') && !hasDiffTools ? 'subagent-log-analyzer' : 'lead-architect';
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
    const msgs = useAgentStore.getState().chatMessages, idx = msgs.findIndex((m) => m.id === message.id);
    const prev = [...msgs.slice(0, idx >= 0 ? idx : msgs.length)].reverse().find((m) => m.role === 'user' && m.text);
    if (prev?.text) void sendChatMessage(prev.text);
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
                title={isBodyCollapsed ? "Expand" : "Collapse"}
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
          <button type="button" onClick={() => setIsBodyCollapsed(false)} className="text-[11px] text-app-muted hover:text-app-text italic py-0.5 flex items-center gap-1.5 cursor-pointer text-left">
            <ChevronRight size={11} className="text-primary shrink-0" />
            <span>Response collapsed. Click to expand.</span>
          </button>
        ) : message.text ? (
          <div>
            <MarkdownMessageBody content={message.text} />
            {isLive && <StreamingCaret />}
            {isLive && <AgentThinkingIndicator message={message} compact />}
          </div>
        ) : isLive ? (
          <AgentThinkingIndicator message={message} />
        ) : null}

        {message.status === 'cancelled' && (
          <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300/90"><CircleStop size={11} /> {message.error || 'Stopped before completion'}</div>
        )}
        {message.status === 'failed' && message.error && (
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10.5px] text-rose-300">
            <div className="flex items-center gap-1.5 min-w-0"><AlertTriangle size={12} className="shrink-0 text-rose-400" /><span className="truncate">{message.error}</span></div>
            <div className="flex items-center gap-2 self-end">
              {/503|high demand|UNAVAILABLE/i.test(message.error) && (
                <button type="button" onClick={() => {
                  useAgentStore.getState().updateEngineSettings({ provider: 'antigravity', selectedModel: 'gemini-2.5-pro' });
                  window.lamApi?.settingsAPI?.saveSettings?.({ aiProvider: 'antigravity', aiModel: 'gemini-2.5-pro' });
                  handleRerunPrompt();
                }} className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-medium flex items-center gap-1 transition-colors">
                  <Sparkles size={10} className="text-emerald-400" /> <span>Use Antigravity (Zero 503)</span>
                </button>
              )}
              <button type="button" onClick={handleRerunPrompt} className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-medium flex items-center gap-1 transition-colors">
                <RotateCcw size={10} /> <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {!isUser && !isLive && !isBodyCollapsed && <ChatMessageDiffBanner message={message} />}
        {!isUser && !isLive && !isBodyCollapsed && <ChatMessageClarificationSection message={message} />}
        {!isUser && !isLive && !isBodyCollapsed && <ChatMessageDelegationSection message={message} />}

        {!isLive && (
          <ChatMessageFooterActions message={message} meta={meta} isUser={isUser} onCopy={handleCopyText} copied={copied} onRerun={handleRerunPrompt} />
        )}
      </div>
    </div>
  );
};

export const ChatMessageItem = React.memo(ChatMessageItemBase);
