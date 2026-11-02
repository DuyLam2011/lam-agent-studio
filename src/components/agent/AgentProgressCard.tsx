import React from 'react';
import { Bot, Loader2, CheckCircle2, Shield, Search, FileCode, Terminal, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface AgentStep {
  type: string;
  name?: string;
  label: string;
  status: 'running' | 'done';
  timeMs?: number;
}

interface AgentProgressCardProps {
  liveSteps: AgentStep[];
  elapsedSec: number;
  model: string;
}

export const AgentProgressCard: React.FC<AgentProgressCardProps> = ({ liveSteps, elapsedSec, model }) => {
  const getPhaseInfo = (steps: AgentStep[]) => {
    const last = steps[steps.length - 1];
    const text = (last?.label || '').toLowerCase();
    if (text.includes('security') || text.includes('owasp') || text.includes('vulnerab') || text.includes('leak') || text.includes('audit')) {
      return { title: 'Security & Vulnerability Audit', icon: <Shield size={12} className="text-gray-300" /> };
    }
    if (text.includes('patch') || text.includes('write') || text.includes('edit')) {
      return { title: 'Surgical Code Implementation', icon: <FileCode size={12} className="text-gray-300" /> };
    }
    if (text.includes('synthesiz') || text.includes('report') || text.includes('findings')) {
      return { title: 'Synthesizing Executive Report', icon: <Sparkles size={12} className="text-gray-300" /> };
    }
    if (text.includes('git') || text.includes('diff') || text.includes('survey') || text.includes('read')) {
      return { title: 'Context & Codebase Survey', icon: <Search size={12} className="text-gray-300" /> };
    }
    return { title: 'Autonomous Execution Pipeline', icon: <Bot size={12} className="text-gray-300" /> };
  };

  const getStepIcon = (label: string, status: 'running' | 'done') => {
    if (status === 'running') return <Loader2 size={11} className="animate-spin text-primary shrink-0" />;
    const l = label.toLowerCase();
    if (l.includes('security') || l.includes('audit')) return <Shield size={11} className="text-gray-400 shrink-0" />;
    if (l.includes('git') || l.includes('diff') || l.includes('read')) return <Search size={11} className="text-gray-400 shrink-0" />;
    if (l.includes('patch') || l.includes('write') || l.includes('edit')) return <FileCode size={11} className="text-gray-400 shrink-0" />;
    if (l.includes('command') || l.includes('repl')) return <Terminal size={11} className="text-gray-400 shrink-0" />;
    return <CheckCircle2 size={11} className="text-gray-400 shrink-0" />;
  };

  const phase = getPhaseInfo(liveSteps);

  return (
    <div className="flex gap-2.5 my-2 animate-in fade-in duration-150 select-none max-w-full">
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
        <Bot size={14} />
      </div>

      <div className="w-full max-w-lg rounded-xl surface-card border border-white/10 shadow-lg p-3 space-y-2">
        {/* Header with Phase Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-gray-200 flex items-center gap-1.5 font-medium shrink-0">
              {phase.icon}
              <span className="truncate">{phase.title}</span>
            </span>
          </div>
          <span className="text-[10px] text-gray-300 font-mono font-medium shrink-0">{elapsedSec}s</span>
        </div>

        {/* Live Step Stream */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {liveSteps.length === 0 ? (
            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>Initializing {model || 'AI'} reasoning engine...</span>
            </div>
          ) : (
            liveSteps.map((s, idx) => (
              <div
                key={idx}
                className={clsx(
                  "flex items-center justify-between gap-2 text-[10.5px] font-mono px-2 py-1 rounded transition-colors",
                  s.status === 'running'
                    ? "bg-white/10 border border-white/15 text-white"
                    : "bg-white/[0.02] text-gray-300 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStepIcon(s.label, s.status)}
                  <span className="truncate">{s.label}</span>
                </div>
                {s.timeMs !== undefined && (
                  <span className="text-[9px] text-gray-400 shrink-0 font-mono">{s.timeMs}ms</span>
                )}
              </div>
            ))
          )}
        </div>

        {elapsedSec >= 5 && (
          <div className="text-[9.5px] text-gray-400 font-mono pt-1.5 border-t border-white/5 flex items-center justify-between">
            <span>Model: <span className="text-gray-200">{model}</span></span>
            <span className="text-gray-400">Autonomous ReAct Pipeline</span>
          </div>
        )}
      </div>
    </div>
  );
};
