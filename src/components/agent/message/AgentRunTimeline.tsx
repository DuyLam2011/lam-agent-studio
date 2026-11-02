import React, { useEffect, useMemo, useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Loader2, Wrench } from 'lucide-react';
import { ChatMessage } from '../../../store/useAgentStore';
import { useAgentRunStore } from '../../../store/useAgentRunStore';
import type { AgentTraceItem } from '../../../types/agent-stream';
import { ToolCallCard } from '../ToolCallCard';
import { ThinkingBlock } from './ThinkingBlock';
import { ThoughtSteeringBadge } from './ThoughtSteeringBadge';

const formatDuration = (ms: number) => {
  const sec = Math.max(1, Math.round(ms / 1000));
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
};

const ElapsedTimer: React.FC<{ since: number }> = ({ since }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="text-[10px] font-mono text-app-muted tabular-nums">{formatDuration(now - since)}</span>;
};

/** Messages saved before streaming existed carry thinking/toolCalls but no trace. */
const legacyTrace = (message: ChatMessage): AgentTraceItem[] => {
  const items: AgentTraceItem[] = [];
  if (message.thinking) items.push({ kind: 'thinking', id: `legacy-th-${message.id}`, turn: 0, text: message.thinking, startedAt: 0, endedAt: 0 });
  for (const tc of message.toolCalls || []) items.push({ kind: 'tool', id: `legacy-tc-${tc.id}`, turn: 0, toolCallId: tc.id });
  return items;
};

interface AgentRunTimelineProps {
  message: ChatMessage;
  isLive: boolean;
}

/**
 * Interleaved reasoning + tool timeline for an agent reply. Expanded while the
 * run streams so users can follow along, collapsed to a one-line summary after.
 */
export const AgentRunTimeline: React.FC<AgentRunTimelineProps> = ({ message, isLive }) => {
  const activeRun = useAgentRunStore((s) => (s.activeRun?.messageId === message.id ? s.activeRun : null));
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? isLive;

  const trace = useMemo(() => (message.trace && message.trace.length > 0 ? message.trace : legacyTrace(message)), [message]);
  const toolsById = useMemo(() => new Map((message.toolCalls || []).map((t) => [t.id, t])), [message.toolCalls]);

  if (!isLive && trace.length === 0) return null;

  const toolCount = trace.filter((t) => t.kind === 'tool').length;
  const failedCount = (message.toolCalls || []).filter((t) => t.status === 'failed').length;
  const thinkingMs = trace.reduce((sum, t) => (t.kind === 'thinking' && t.endedAt && t.startedAt ? sum + (t.endedAt - t.startedAt) : sum), 0);
  const hasThinking = trace.some((t) => t.kind === 'thinking');
  const lastItem = trace[trace.length - 1];

  const summary = hasThinking
    ? (thinkingMs > 0 ? `Thought for ${formatDuration(thinkingMs)}` : 'Reasoning')
    : (message.durationMs ? `Worked for ${formatDuration(message.durationMs)}` : 'Steps');

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setManualOpen(!open);
        }}
        title={open ? "Đóng thanh chi tiết tiến trình agent" : "Mở thanh chi tiết tiến trình agent (thinking, tool calls)"}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10.5px] hover:bg-white/5 transition-colors cursor-pointer select-none text-left"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {isLive
            ? <Loader2 size={12} className="animate-spin text-primary shrink-0" />
            : <Brain size={12} className="text-gray-400 shrink-0" />}
          <span className={isLive ? 'truncate text-gray-200 font-medium' : 'truncate text-app-text font-medium'}>
            {isLive ? (activeRun?.phaseLabel || 'Thinking...') : summary}
          </span>
          {toolCount > 0 && (
            <span className="flex items-center gap-1 text-app-muted shrink-0">
              <Wrench size={10} /> {toolCount}{failedCount > 0 && <span className="text-rose-400">· {failedCount} failed</span>}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {isLive && activeRun && <ElapsedTimer since={activeRun.startedAt} />}
          {open ? <ChevronDown size={12} className="text-app-muted" /> : <ChevronRight size={12} className="text-app-muted" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/5 px-2.5 py-2 space-y-2">
          {trace.length === 0 && (
            <div className="text-[11px] text-app-muted font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Waiting for {message.model || 'the model'}...
            </div>
          )}
          {trace.map((item) => {
            if (item.kind === 'thinking') {
              return <ThinkingBlock key={item.id} text={item.text} live={isLive && item === lastItem && !item.endedAt} />;
            }
            if (item.kind === 'thought_steer') {
              return (
                <ThoughtSteeringBadge
                  key={item.id}
                  anomalyType={item.anomalyType}
                  reason={item.reason}
                  correctiveDirective={item.correctiveDirective}
                />
              );
            }
            const toolCall = toolsById.get(item.toolCallId);
            return toolCall ? <ToolCallCard key={item.id} toolCall={toolCall} /> : null;
          })}
        </div>
      )}
    </div>
  );
};
