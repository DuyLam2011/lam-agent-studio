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
  const agentName = currentTask?.agentName || terminalAgentConfig.agentName || 'L.A.M Core Agent';

  const getStatusBadge = () => {
    switch (effectiveStatus) {
      case 'analyzing_terminal':
        return {
          icon: Terminal,
          color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
          glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
          label: 'Analyzing Terminal',
          avatarBg: 'from-emerald-600/40 to-teal-800/40'
        };
      case 'reviewing_git':
        return {
          icon: GitBranch,
          color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
          glow: 'shadow-[0_0_12px_rgba(6,182,212,0.5)]',
          label: 'Reviewing Code',
          avatarBg: 'from-cyan-600/40 to-blue-800/40'
        };
      case 'thinking':
        return {
          icon: Cpu,
          color: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
          label: 'Thinking...',
          avatarBg: 'from-amber-600/40 to-purple-800/40'
        };
      case 'executing':
        return {
          icon: Sparkles,
          color: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
          glow: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]',
          label: 'Executing Tools',
          avatarBg: 'from-purple-600/40 to-pink-800/40'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
          glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
          label: 'Review Ready',
          avatarBg: 'from-emerald-600/30 to-blue-800/30'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
          glow: 'shadow-[0_0_12px_rgba(244,63,94,0.5)]',
          label: 'Attention Needed',
          avatarBg: 'from-rose-600/40 to-red-800/40'
        };
      default:
        return {
          icon: Bot,
          color: 'text-gray-400 bg-white/5 border-white/10',
          glow: '',
          label: 'Agent Ready',
          avatarBg: 'from-purple-900/30 to-indigo-950/40'
        };
    }
  };

  const badge = getStatusBadge();
  const Icon = badge.icon;
  const isBusy = effectiveStatus !== 'idle' && effectiveStatus !== 'completed';

  return (
    <button
      type="button"
      onClick={toggleInspector}
      title={`${agentName} (${badge.label})\nClick to open Agent Inspector`}
      className={clsx(
        "group relative flex items-center gap-2 px-2.5 py-1 rounded-xl transition-all duration-300",
        "bg-white/5 hover:bg-white/10 border backdrop-blur-xl select-none",
        isInspectorOpen ? "border-purple-500/50 bg-purple-500/10 shadow-lg" : "border-white/10",
        badge.glow,
        className
      )}
    >
      {/* Animated Agent Figure Avatar */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Aura Rings when Active */}
        {isBusy && (
          <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping opacity-75 duration-1000" />
        )}
        <div
          className={clsx(
            "w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center border transition-transform duration-300 group-hover:scale-110",
            badge.avatarBg,
            isBusy ? "border-white/30" : "border-white/10"
          )}
        >
          <Bot size={13} className={clsx(badge.color.split(' ')[0], isBusy && "animate-pulse")} />
        </div>

        {/* Mini Status Dot / Sub-Icon */}
        <span
          className={clsx(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center border border-neutral-900 text-[8px]",
            badge.color
          )}
        >
          <Icon size={7} />
        </span>
      </div>

      {/* Agent Info Pill */}
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-semibold text-gray-200 leading-tight group-hover:text-white transition-colors truncate max-w-[100px]">
          {agentName}
        </span>
        <span className={clsx("text-[8px] font-mono leading-none tracking-tight truncate max-w-[100px]", badge.color.split(' ')[0])}>
          {badge.label}
        </span>
      </div>

      {/* Active task counter indicator */}
      {currentTask && (
        <span className="ml-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
      )}
    </button>
  );
};
export default AgentStatusWidget;
