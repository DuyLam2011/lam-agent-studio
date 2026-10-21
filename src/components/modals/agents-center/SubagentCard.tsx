import React from 'react';
import { Bot, Sparkles, Trash2, Lock, Play, MessageSquare } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import { useAgentStore } from '../../../store/useAgentStore';
import { runAgentReview } from '../../../services/agentReviewService';
import { ScopeBadge, ReasoningBadge } from './SubagentBadges';
import clsx from 'clsx';

interface SubagentCardProps {
  subagent: SubagentPersona;
  currentScopeTargetId?: string;
}

export const SubagentCard: React.FC<SubagentCardProps> = ({ subagent, currentScopeTargetId }) => {
  const { toggleSubagentActive, deleteSubagent, addToast, systemContext, setAgentsCenterOpen, updateEngineSettings, setRightPanelTab, setPanelVisible, engineSettings } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && subagent.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = subagent.active && !isExcluded;

  const handleReview = () => {
    const ws = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
    const repoPath = ws?.folders?.[0] || systemContext.cwd;
    if (!repoPath) {
      addToast('No active repository found', 'info');
      return;
    }
    setAgentsCenterOpen(false);
    addToast(`Agent ${subagent.name} is reviewing repository...`, 'info');
    runAgentReview({ repoPath, agent: subagent });
  };

  const handleChat = () => {
    updateEngineSettings({ persona: subagent.name, selectedModel: subagent.model || engineSettings.selectedModel });
    setAgentsCenterOpen(false);
    setRightPanelTab('chat');
    setPanelVisible('agent', true);
    addToast(`Switched active chat to ${subagent.name}`, 'success');
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
              <ScopeBadge scope={subagent.scope} />
              <ReasoningBadge effort={subagent.reasoningEffort} />
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
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm">
            <Lock size={10} className="text-amber-400" />
            <span>Repo Enforced</span>
          </div>
        ) : subagent.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm">
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReview}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] transition-colors"
            title="Assign this agent to inspect and review repository changes"
          >
            <Play size={10} /> Review Repo
          </button>
          <button
            onClick={handleChat}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] transition-colors"
            title="Open chat session with this agent"
          >
            <MessageSquare size={10} /> Chat
          </button>
        </div>

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
