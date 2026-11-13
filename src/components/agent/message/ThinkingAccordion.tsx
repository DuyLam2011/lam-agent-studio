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
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/[0.15] overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10.5px] hover:bg-cyan-500/10 transition-colors select-none text-left"
        title={isOpen ? "Thu gọn chuỗi suy luận" : "Mở rộng chuỗi suy luận"}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Brain size={12} className={clsx("shrink-0", isLive ? "text-cyan-400 animate-pulse" : "text-cyan-300/80")} />
          <span className="font-semibold text-cyan-200 truncate">
            {isLive ? 'Đang suy luận (Thinking Chain)...' : 'Chuỗi suy luận (Reasoning Process)'}
          </span>
          <span className="text-[9.5px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/30 shrink-0">
            {totalThinkingMs > 0 ? formatDuration(totalThinkingMs) : (isLive ? 'Live' : 'Done')}
          </span>
        </span>

        <span className="flex items-center gap-1 shrink-0 text-cyan-400/70">
          {isLive && <Sparkles size={11} className="animate-spin" />}
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-cyan-500/15 p-2.5 space-y-2 bg-black/20">
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
