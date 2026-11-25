import React, { useEffect, useRef } from 'react';
import { MarkdownMessageBody } from './MarkdownMessageBody';
import { Compass, Sparkles, Zap } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';

export const StreamingCaret: React.FC = () => (
  <span aria-hidden className="inline-block w-[6px] h-[13px] ml-0.5 align-[-2px] rounded-[1px] bg-primary/80 animate-pulse" />
);

interface ThinkingBlockProps {
  text: string;
  live: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ text, live }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);
  const { setPendingChatPrompt } = useAgentStore();

  useEffect(() => {
    const el = scrollRef.current;
    if (!live || !el || !pinnedToBottomRef.current) return;
    const raf = requestAnimationFrame(() => {
      if (scrollRef.current && pinnedToBottomRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [text, live]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
  };

  const detectPhase = (str: string): string | null => {
    const match = str.match(/\[(EXPLORING|ANALYZING|PLANNING|REMEDIATING|PATCHING|VERIFYING|TESTING)\]/i);
    return match ? match[1].toUpperCase() : null;
  };

  const detectComplexity = (str: string): string | null => {
    const match = str.match(/\[TASK_COMPLEXITY(?:_ROUTER)?:?\s*([^\]]+)\]/i);
    return match ? match[1].trim() : null;
  };

  const phase = detectPhase(text);
  const complexity = detectComplexity(text);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {complexity && (
          <div className="flex items-center gap-1 text-[9.5px] font-mono text-amber-300 select-none">
            <Zap size={11} className="text-amber-400 shrink-0" />
            <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
              Complexity: {complexity}
            </span>
          </div>
        )}
        {phase && (
          <div className="flex items-center gap-1 text-[9.5px] font-mono text-cyan-400 select-none">
            <Sparkles size={11} className="text-cyan-400 shrink-0" />
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">
              Phase: {phase}
            </span>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-56 overflow-y-auto custom-scrollbar border-l-2 border-white/15 pl-2.5 pr-1 text-gray-300"
      >
        <MarkdownMessageBody content={text} compact />
        {live && <StreamingCaret />}
      </div>

      {live && (
        <div className="flex items-center gap-1.5 pt-1 text-[9.5px] flex-wrap">
          <span className="text-app-muted flex items-center gap-1 select-none">
            <Compass size={10} className="text-primary" />
            <span>Quick steer:</span>
          </span>
          <button
            type="button"
            onClick={() => setPendingChatPrompt('Steer: Stop guessing and inspect the actual files on disk')}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            Read actual files
          </button>
          <button
            type="button"
            onClick={() => setPendingChatPrompt('Steer: Check git diff and run tests to verify')}
            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            Check Git &amp; Tests
          </button>
        </div>
      )}
    </div>
  );
};
