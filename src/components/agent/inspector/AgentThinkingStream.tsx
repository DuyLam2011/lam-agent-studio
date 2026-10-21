import React, { useRef, useEffect } from 'react';
import { AgentThinkingEntry } from '../../../types/agent-activity';
import { useAgentActivityStore } from '../../../store/useAgentActivityStore';
import { Terminal, Lightbulb, Zap, AlertTriangle, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface AgentThinkingStreamProps {
  entries: AgentThinkingEntry[];
}

export const AgentThinkingStream: React.FC<AgentThinkingStreamProps> = ({ entries }) => {
  const { currentTask } = useAgentActivityStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, currentTask?.status]);

  const renderIcon = (type: AgentThinkingEntry['type']) => {
    switch (type) {
      case 'action': return <Zap size={11} className="text-purple-400" />;
      case 'finding': return <Lightbulb size={11} className="text-amber-400" />;
      case 'error': return <AlertTriangle size={11} className="text-rose-400" />;
      case 'info': return <Info size={11} className="text-cyan-400" />;
      default: return <Terminal size={11} className="text-blue-400" />;
    }
  };

  const isWorking = currentTask?.status === 'thinking' || currentTask?.status === 'reviewing_git';

  if ((!entries || entries.length === 0) && !isWorking) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-gray-500 text-xs">
        <Lightbulb size={24} className="mb-2 opacity-40 text-gray-400" />
        <span>No thoughts or execution traces logged yet.</span>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-2 max-h-72 overflow-y-auto pr-1 select-text">
      {entries.map((entry) => {
        const timeStr = new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          <div
            key={entry.id}
            className="flex items-start gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] leading-relaxed text-gray-300 font-mono"
          >
            <div className="mt-0.5 shrink-0 opacity-80">{renderIcon(entry.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] text-gray-500">{timeStr}</span>
                <span className={clsx(
                  "text-[8px] uppercase px-1 rounded font-semibold",
                  entry.type === 'action' && "bg-purple-500/20 text-purple-300",
                  entry.type === 'finding' && "bg-amber-500/20 text-amber-300",
                  entry.type === 'error' && "bg-rose-500/20 text-rose-300",
                  entry.type === 'reasoning' && "bg-blue-500/20 text-blue-300",
                  entry.type === 'info' && "bg-white/10 text-gray-300"
                )}>
                  {entry.type}
                </span>
              </div>
              <p className="break-words whitespace-pre-wrap">{entry.message}</p>
            </div>
          </div>
        );
      })}

      {isWorking && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono animate-pulse">
          <Loader2 size={13} className="animate-spin text-cyan-400 shrink-0" />
          <span>Agent is analyzing changes and reasoning with Gemini...</span>
        </div>
      )}
    </div>
  );
};
