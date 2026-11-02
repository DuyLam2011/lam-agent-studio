import React from 'react';
import { Bot, Terminal, GitBranch, Cpu, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAgentActivityStore } from '../../store/useAgentActivityStore';
import { useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

export const AgentStatusWidget: React.FC<{ className?: string }> = ({ className }) => {
  const { currentTask, isInspectorOpen, toggleInspector } = useAgentActivityStore();
  const { terminalAgentConfig } = useAgentStore();

  const isTerminalActive = terminalAgentConfig.status === 'monitoring' || terminalAgentConfig.status === 'executing';
  const effectiveStatus = currentTask ? currentTask.status : (isTerminalActive ? 'analyzing_terminal' : 'idle');
  const agentName = currentTask?.agentName || terminalAgentConfig.agentName || 'L.A.M Core';

  const getStatusLabel = () => {
    switch (effectiveStatus) {
      case 'analyzing_terminal': return { label: 'Terminal Active', icon: Terminal };
      case 'reviewing_git': return { label: 'Reviewing Code', icon: GitBranch };
      case 'thinking': return { label: 'Thinking...', icon: Cpu };
      case 'executing': return { label: 'Executing...', icon: Sparkles };
      case 'completed': return { label: 'Ready', icon: CheckCircle2 };
      case 'error': return { label: 'Attention', icon: AlertCircle };
      default: return { label: 'Standby', icon: Bot };
    }
  };

  const { label, icon: Icon } = getStatusLabel();
  const isBusy = effectiveStatus !== 'idle' && effectiveStatus !== 'completed';

  return (
    <button
      type="button"
      onClick={toggleInspector}
      title={`${agentName} (${label})\nClick to open Agent Inspector`}
      className={clsx(
        "group relative flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all duration-200",
        "border select-none text-xs",
        isInspectorOpen
          ? "border-primary bg-primary/15 text-primary shadow-sm"
          : isBusy
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-black/20 text-app-sub hover:text-app-text hover:bg-white/5",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {isBusy && <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping opacity-75" />}
        <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center border border-primary/30">
          <Icon size={11} className={clsx("text-primary", isBusy && "animate-pulse")} />
        </div>
      </div>

      <div className="flex flex-col text-left">
        <span className="text-[10px] font-semibold text-app-text leading-tight truncate max-w-[90px]">
          {agentName}
        </span>
        <span className="text-[8px] font-mono leading-none text-primary truncate max-w-[90px]">
          {label}
        </span>
      </div>
    </button>
  );
};

export default AgentStatusWidget;
