import React, { useState } from 'react';
import { Brain, Copy, Check, GitCommit } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { ToolCallCard } from './ToolCallCard';
import { AgentAvatar } from './avatar/AgentAvatar';
import { AGENT_VISUAL_REGISTRY, AgentRoleType } from '../../types/avatar';

export const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { pendingAgentDiffs, setDiffReviewModalOpen } = useAgentStore();
  const [showThinking, setShowThinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  // Determine active agent persona based on task tools or role metadata
  const hasDiffTools = message.toolCalls?.some(tc => tc.name === 'write_file' || tc.name === 'edit_file');
  const hasCommandTools = message.toolCalls?.some(tc => tc.name === 'run_command');

  let activeRole: AgentRoleType = 'lead-architect';
  if (isUser) {
    activeRole = 'user';
  } else if (message.agentRole && message.agentRole in AGENT_VISUAL_REGISTRY) {
    activeRole = message.agentRole as AgentRoleType;
  } else if (hasDiffTools) {
    activeRole = 'subagent-qa-reviewer';
  } else if (hasCommandTools) {
    activeRole = 'subagent-log-analyzer';
  }

  const roleMeta = AGENT_VISUAL_REGISTRY[activeRole];

  return (
    <div className={clsx("flex gap-2.5 my-2.5 group", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Dynamic Agent Avatar */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <AgentAvatar
          role={activeRole}
          size="md"
          showStatusDot={!isUser}
          showTooltip={true}
        />
        {!isUser && (
          <span
            className="text-[8px] font-mono font-bold px-1 py-0.2 rounded border uppercase tracking-wider"
            style={{
              backgroundColor: `${roleMeta.themeColor}15`,
              borderColor: `${roleMeta.themeColor}35`,
              color: roleMeta.themeColor
            }}
          >
            {roleMeta.badgeLabel}
          </span>
        )}
      </div>

      {/* Bubble Content */}
      <div className={clsx(
        "max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed space-y-2 relative border",
        isUser
          ? "bg-primary/20 border-primary/30 text-app-text shadow-sm"
          : "surface-card text-app-text shadow-md"
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

        {/* Message Main Body */}
        <div className="whitespace-pre-wrap select-text font-normal text-app-text">
          {message.text}
        </div>

        {/* Diff Review Action Banner */}
        {!isUser && pendingAgentDiffs.length > 0 && hasDiffTools && (
          <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-300">
              <GitCommit size={13} className="text-purple-400 shrink-0" />
              <span>Agent modified {pendingAgentDiffs.length} {pendingAgentDiffs.length === 1 ? 'file' : 'files'}</span>
            </div>
            <button
              onClick={() => setDiffReviewModalOpen(true)}
              className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px] transition-colors shadow-sm shrink-0"
            >
              Review Diffs & Revert
            </button>
          </div>
        )}

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
