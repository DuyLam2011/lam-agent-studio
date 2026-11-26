import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import type { AgentTraceItem } from '../../../types/agent-stream';
import { ThinkingBlock } from './ThinkingBlock';
import clsx from 'clsx';

interface ThinkingAccordionProps {
  thinkingItems: Extract<AgentTraceItem, { kind: 'thinking' }>[];
  isLive: boolean;
  lastItem?: AgentTraceItem;
  defaultOpen?: boolean;
}

const formatDuration = (ms: number) => {
  const sec = Math.max(1, Math.round(ms / 1000));
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
};

export const ThinkingAccordion: React.FC<ThinkingAccordionProps> = ({
  thinkingItems,
  isLive,
  lastItem,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (thinkingItems.length === 0) return null;

  const totalThinkingMs = thinkingItems.reduce(
    (sum, t) => (t.endedAt && t.startedAt ? sum + (t.endedAt - t.startedAt) : sum),
    0
  );

  return (
    <div className="rounded-xl border border-primary/25 surface-input overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10.5px] hover:bg-primary/10 transition-colors select-none text-left cursor-pointer"
        title={isOpen ? "Collapse thinking trace" : "Expand thinking trace"}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Brain size={12} className={clsx("shrink-0", isLive ? "text-primary animate-pulse" : "text-primary/80")} />
          <span className="font-semibold text-app-text truncate">
            {isLive ? 'Thinking Chain (Active)...' : 'Reasoning Process'}
          </span>
          <span className="text-[9.5px] font-mono text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/25 shrink-0">
            {totalThinkingMs > 0 ? formatDuration(totalThinkingMs) : (isLive ? 'Live' : 'Done')}
          </span>
        </span>

        <span className="flex items-center gap-1 shrink-0 text-primary">
          {isLive && <Sparkles size={11} className="animate-spin" />}
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-subtle p-2.5 space-y-2">
          {thinkingItems.map((item) => (
            <ThinkingBlock
              key={item.id}
              text={item.text}
              live={isLive && item === lastItem && !item.endedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
};
