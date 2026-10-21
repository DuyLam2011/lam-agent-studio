import React from 'react';
import { Bot, X, Trash2, Clock } from 'lucide-react';
import { useAgentActivityStore } from '../../../store/useAgentActivityStore';
import clsx from 'clsx';

export const AgentInspectorHeader: React.FC = () => {
  const { currentTask, clearTask, setInspectorOpen } = useAgentActivityStore();

  const elapsedSeconds = currentTask?.startTime 
    ? Math.max(0, Math.floor(((currentTask.endTime || Date.now()) - currentTask.startTime) / 1000))
    : 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-white/10 flex items-center justify-center shadow-inner">
          <Bot size={16} className="text-cyan-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white tracking-wide">
              {currentTask?.agentName || 'Agent Inspector'}
            </h3>
            {currentTask && (
              <span className={clsx(
                "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold border",
                currentTask.status === 'completed' && "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
                currentTask.status === 'reviewing_git' && "text-cyan-300 bg-cyan-500/20 border-cyan-500/30 animate-pulse",
                currentTask.status === 'analyzing_terminal' && "text-emerald-300 bg-emerald-500/20 border-emerald-500/30 animate-pulse",
                currentTask.status === 'thinking' && "text-amber-300 bg-amber-500/20 border-amber-500/30 animate-pulse",
                currentTask.status === 'error' && "text-rose-300 bg-rose-500/20 border-rose-500/30"
              )}>
                {currentTask.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 truncate max-w-[280px]">
            {currentTask?.title || 'No active task running'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentTask && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
            <Clock size={10} className="text-gray-400" />
            <span>{elapsedSeconds}s</span>
          </div>
        )}
        {currentTask && (
          <button
            onClick={clearTask}
            title="Clear Task History"
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
        <button
          onClick={() => setInspectorOpen(false)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
          title="Close Inspector (Esc)"
        >
          <X size={13} />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
};
