import React, { useEffect, useMemo, useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Loader2, Wrench } from 'lucide-react';
import { ChatMessage } from '../../../store/useAgentStore';
import { useAgentRunStore } from '../../../store/useAgentRunStore';
import type { AgentTraceItem } from '../../../types/agent-stream';
import { ThoughtSteeringBadge } from './ThoughtSteeringBadge';
import { ThinkingAccordion } from './ThinkingAccordion';
import { TasksAccordion } from './TasksAccordion';
import { FatherAgentControlBar } from './FatherAgentControlBar';

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

export const AgentRunTimeline: React.FC<AgentRunTimelineProps> = ({ message, isLive }) => {
  const activeRun = useAgentRunStore((s) => (s.activeRun?.messageId === message.id ? s.activeRun : null));
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);

  const trace = useMemo(() => (message.trace && message.trace.length > 0 ? message.trace : legacyTrace(message)), [message]);
  const toolsById = useMemo(() => new Map((message.toolCalls || []).map((t) => [t.id, t])), [message.toolCalls]);

  const thinkingItems = trace.filter((t): t is Extract<AgentTraceItem, { kind: 'thinking' }> => t.kind === 'thinking');
  const toolItems = trace.filter((t): t is Extract<AgentTraceItem, { kind: 'tool' }> => t.kind === 'tool');
  const steerItems = trace.filter((t): t is Extract<AgentTraceItem, { kind: 'thought_steer' }> => t.kind === 'thought_steer');

  const open = manualOpen ?? (isLive || toolItems.length > 0 || thinkingItems.length > 0);
  if (!isLive && trace.length === 0) return null;

  const thinkingMs = thinkingItems.reduce((sum, t) => (t.endedAt && t.startedAt ? sum + (t.endedAt - t.startedAt) : sum), 0);
  const summary = thinkingItems.length > 0
    ? (thinkingMs > 0 ? `Thought for ${formatDuration(thinkingMs)}` : 'Reasoning')
    : (message.durationMs ? `Worked for ${formatDuration(message.durationMs)}` : 'Execution');

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setManualOpen(!open);
        }}
        title={open ? "Thu gọn thanh tiến trình agent" : "Mở rộng thanh tiến trình agent"}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10.5px] hover:bg-white/5 transition-colors cursor-pointer select-none text-left"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {isLive ? <Loader2 size={12} className="animate-spin text-primary shrink-0" /> : <Brain size={12} className="text-gray-400 shrink-0" />}
          <span className={isLive ? 'truncate text-gray-200 font-medium' : 'truncate text-app-text font-medium'}>
            {isLive ? (activeRun?.phaseLabel || 'Reasoning & Orchestrating...') : summary}
          </span>
          {toolItems.length > 0 && (
            <span className="flex items-center gap-1 text-app-muted shrink-0">
              <Wrench size={10} /> {toolItems.length} tasks
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {isLive && activeRun && <ElapsedTimer since={activeRun.startedAt} />}
          {open ? <ChevronDown size={12} className="text-app-muted" /> : <ChevronRight size={12} className="text-app-muted" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/5 p-2 space-y-2">
          {steerItems.map((item) => (
            <ThoughtSteeringBadge
              key={item.id}
              anomalyType={item.anomalyType}
              reason={item.reason}
              correctiveDirective={item.correctiveDirective}
            />
          ))}

          <ThinkingAccordion
            thinkingItems={thinkingItems}
            isLive={isLive}
            lastItem={trace[trace.length - 1]}
            defaultOpen={isLive || thinkingItems.length > 0}
          />

          <TasksAccordion
            toolItems={toolItems}
            toolsById={toolsById}
            isLive={isLive}
            defaultOpen={isLive || toolItems.length > 0}
          />

          <FatherAgentControlBar isLive={isLive} model={message.model} />
        </div>
      )}
    </div>
  );
};
