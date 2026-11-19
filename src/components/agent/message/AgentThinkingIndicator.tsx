import React, { useMemo } from 'react';
import { Brain, Terminal, Cpu } from 'lucide-react';
import { useAgentRunStore } from '../../../store/useAgentRunStore';
import { ChatMessage } from '../../../store/useAgentStore';

interface AgentThinkingIndicatorProps {
  message?: ChatMessage;
  compact?: boolean;
}

export const AgentThinkingIndicator: React.FC<AgentThinkingIndicatorProps> = ({ message, compact = false }) => {
  const activeRun = useAgentRunStore((s) => s.activeRun);

  const activePhase = useMemo(() => {
    if (activeRun?.phaseLabel) return activeRun.phaseLabel;
    const activeTool = (message?.toolCalls || []).find((t) => t.status === 'running');
    if (activeTool) return `Executing ${activeTool.name || 'tool'}...`;
    const trace = message?.trace || [];
    const activeThinking = trace.find((t) => t.kind === 'thinking' && !t.endedAt);
    if (activeThinking) return 'Synthesizing Reasoning Trace...';
    return 'Analyzing Context & Formulating Actions...';
  }, [activeRun?.phaseLabel, message?.toolCalls, message?.trace]);

  const getPhaseIcon = () => {
    if (activePhase.toLowerCase().includes('executing') || activePhase.toLowerCase().includes('tool')) {
      return <Terminal size={12} className="text-emerald-400 animate-pulse" />;
    }
    if (activePhase.toLowerCase().includes('subagent') || activePhase.toLowerCase().includes('orchestrat')) {
      return <Cpu size={12} className="text-purple-400 animate-pulse" />;
    }
    return <Brain size={12} className="text-primary animate-pulse" />;
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] text-primary font-medium mt-1 select-none animate-in fade-in duration-200">
        <span className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
        </span>
        <span className="font-mono text-[9.5px] truncate max-w-[260px]">{activePhase}</span>
      </div>
    );
  }

  return (
    <div className="surface-card p-3.5 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-cyan-500/5 to-transparent relative overflow-hidden select-none animate-in fade-in duration-200 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            {getPhaseIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-app-text tracking-wide truncate">
                {activePhase}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 uppercase shrink-0">
                Live Turn
              </span>
            </div>
            <p className="text-[10.5px] text-muted truncate mt-0.5">
              Evaluating workspace files, inspecting diffs & executing commands...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg bg-black/30 border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default AgentThinkingIndicator;
