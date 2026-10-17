import React from 'react';
import { Bot, Sparkles, Brain, Globe, Folder, GitBranch, Trash2, Cpu, Lock } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface SubagentCardProps {
  subagent: SubagentPersona;
  currentScopeTargetId?: string;
}

export const SubagentCard: React.FC<SubagentCardProps> = ({ subagent, currentScopeTargetId }) => {
  const { toggleSubagentActive, deleteSubagent, addToast } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && subagent.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = subagent.active && !isExcluded;

  const getScopeBadge = () => {
    switch (subagent.scope) {
      case 'global': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1"><Globe size={9} /> GLOBAL</span>;
      case 'workspace': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1"><Folder size={9} /> WORKSPACE</span>;
      case 'repo': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1"><GitBranch size={9} /> REPO</span>;
    }
  };

  const getReasoningBadge = () => {
    const colors: Record<string, string> = {
      high: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
      off: 'text-neutral-500 bg-white/5 border-white/5'
    };
    return (
      <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full border font-mono flex items-center gap-1", colors[subagent.reasoningEffort] || colors.medium)}>
        <Brain size={9} /> {subagent.reasoningEffort.toUpperCase()} REASONING
      </span>
    );
  };

  return (
    <div className={clsx(
      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
      isSwitchActive ? "bg-white/5 border-white/10 hover:border-white/20 shadow-lg" : "bg-black/20 border-white/5 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
            <Bot size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-200 truncate">{subagent.name}</span>
              {getScopeBadge()}
              {getReasoningBadge()}
              {isExcluded && <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">Disabled for this scope</span>}
              <span className="text-[9px] text-gray-400 bg-black/40 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">{subagent.model}</span>
            </div>
            <div className="text-[10px] text-pink-300 font-medium mt-0.5 flex items-center gap-1">
              <Sparkles size={9} /> {subagent.role}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed italic">
              "{subagent.systemPrompt.slice(0, 140)}..."
            </p>
          </div>
        </div>

        {subagent.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Repository subagents are anchored to codebase specifications and always active">
            <Lock size={10} className="text-amber-400" />
            <span>Repo Enforced</span>
          </div>
        ) : subagent.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Workspace subagents are anchored to workspace policies and always active">
            <Lock size={10} className="text-purple-400" />
            <span>Workspace Enforced</span>
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isSwitchActive}
            onClick={(e) => {
              e.stopPropagation();
              toggleSubagentActive(subagent.id, !isSwitchActive, currentScopeTargetId);
            }}
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer", isSwitchActive ? "bg-pink-500" : "bg-white/10")}
            title={isSwitchActive ? (currentScopeTargetId ? "Active for this scope. Click to disable here." : "Subagent enabled.") : (isExcluded ? "Disabled for this scope. Click to enable here." : "Subagent disabled.")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Skills:</span>
          {subagent.allowedSkills.length === 0 ? (
            <span className="text-[9px] text-gray-500 italic">All available skills</span>
          ) : (
            subagent.allowedSkills.map((sk) => (
              <span key={sk} className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 text-[9px] font-mono">
                {sk}
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
          <span>Temp: {subagent.temperature}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500 font-mono">
        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1"><Cpu size={10} /> Subagent Swarm Ready</span>
        {!subagent.isBuiltin && subagent.scope === 'global' && (
          <button
            onClick={() => {
              deleteSubagent(subagent.id);
              addToast(`Removed subagent: ${subagent.name}`, 'info');
            }}
            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Subagent Persona"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};
