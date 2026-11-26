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
    const text = (steps[steps.length - 1]?.label || '').toLowerCase();
    if (/security|owasp|vulnerab|leak|audit/.test(text)) return { title: 'Security & Vulnerability Audit', icon: <Shield size={12} className="text-primary" /> };
    if (/patch|write|edit/.test(text)) return { title: 'Surgical Code Implementation', icon: <FileCode size={12} className="text-primary" /> };
    if (/synthesiz|report|findings/.test(text)) return { title: 'Synthesizing Executive Report', icon: <Sparkles size={12} className="text-primary" /> };
    if (/git|diff|survey|read/.test(text)) return { title: 'Context & Codebase Survey', icon: <Search size={12} className="text-primary" /> };
    return { title: 'Autonomous Execution Pipeline', icon: <Bot size={12} className="text-primary" /> };
  };

  const getStepIcon = (label: string, status: 'running' | 'done') => {
    if (status === 'running') return <Loader2 size={11} className="animate-spin text-primary shrink-0" />;
    const l = label.toLowerCase();
    if (/security|audit/.test(l)) return <Shield size={11} className="text-app-muted shrink-0" />;
    if (/git|diff|read/.test(l)) return <Search size={11} className="text-app-muted shrink-0" />;
    if (/patch|write|edit/.test(l)) return <FileCode size={11} className="text-app-muted shrink-0" />;
    if (/command|repl/.test(l)) return <Terminal size={11} className="text-app-muted shrink-0" />;
    return <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />;
  };

  const phase = getPhaseInfo(liveSteps);

  return (
    <div className="flex gap-2.5 my-2 animate-in fade-in duration-150 select-none max-w-full">
      <div className="w-7 h-7 rounded-lg surface-card border border-subtle text-primary flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
        <Bot size={14} />
      </div>

      <div className="w-full max-w-lg rounded-xl surface-card border border-subtle shadow-md p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-subtle pb-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-subtle surface-input text-app-text flex items-center gap-1.5 font-medium shrink-0">
            {phase.icon}
            <span className="truncate">{phase.title}</span>
          </span>
          <span className="text-[10px] text-app-muted font-mono font-medium shrink-0">{elapsedSec}s</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {liveSteps.length === 0 ? (
            <div className="text-[11px] text-app-muted font-mono flex items-center gap-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>Initializing {model || 'AI'} reasoning engine...</span>
            </div>
          ) : (
            liveSteps.map((s, idx) => (
              <div
                key={idx}
                className={clsx(
                  "flex items-center justify-between gap-2 text-[10.5px] font-mono px-2 py-1 rounded transition-colors border",
                  s.status === 'running'
                    ? "bg-primary/10 border-primary/30 text-app-text font-medium"
                    : "surface-input border-transparent text-app-sub"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStepIcon(s.label, s.status)}
                  <span className="truncate">{s.label}</span>
                </div>
                {s.timeMs !== undefined && <span className="text-[9px] text-app-muted shrink-0 font-mono">{s.timeMs}ms</span>}
              </div>
            ))
          )}
        </div>

        {elapsedSec >= 5 && (
          <div className="text-[9.5px] text-app-muted font-mono pt-1.5 border-t border-subtle flex items-center justify-between">
            <span>Model: <span className="text-app-text">{model}</span></span>
            <span>Autonomous ReAct Pipeline</span>
          </div>
        )}
      </div>
    </div>
  );
};
