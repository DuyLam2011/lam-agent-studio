import React from 'react';
import { Bot, Sparkles, Trash2, Lock, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { SubagentPersona } from '../../../types/subagents';
import { useAgentStore } from '../../../store/useAgentStore';
import { ScopeBadge, ReasoningBadge, AgentClassBadge } from './SubagentBadges';
import clsx from 'clsx';

interface SubagentCardProps {
  subagent: SubagentPersona;
  currentScopeTargetId?: string;
}

export const SubagentCard: React.FC<SubagentCardProps> = ({ subagent, currentScopeTargetId }) => {
  const {
    toggleSubagentActive, deleteSubagent, addToast, setAgentsCenterOpen,
    updateEngineSettings, setRightPanelTab, setPanelVisible, engineSettings, setAssigningSubagent,
    getAgentProfile, setTuningAgentProfile
  } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && subagent.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = subagent.active && !isExcluded;

  const handleChat = () => {
    updateEngineSettings({ persona: subagent.name, selectedModel: subagent.model || engineSettings.selectedModel });
    setAgentsCenterOpen(false);
    setRightPanelTab('chat');
    setPanelVisible('agent', true);
    addToast(`Switched active chat to ${subagent.name}`, 'success');
  };

  const allowedRules = subagent.allowedRules || [];

  return (
    <div className={clsx(
      "p-3.5 rounded-xl surface-card border border-subtle transition-all flex flex-col justify-between gap-2.5",
      !isSwitchActive && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Bot size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-app-text truncate">{subagent.name}</span>
              <AgentClassBadge agentClass={subagent.agentClass} />
              <ScopeBadge scope={subagent.scope} />
              <ReasoningBadge effort={subagent.reasoningEffort} />
              {isExcluded && <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">Disabled</span>}
              <span className="text-[9px] text-muted surface-input border border-subtle px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">{subagent.model}</span>
            </div>
            <div className="text-[10px] text-pink-300 font-medium mt-0.5 flex items-center gap-1">
              <Sparkles size={9} /> {subagent.role}
            </div>
            {subagent.targetCapabilities && subagent.targetCapabilities.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                {subagent.targetCapabilities.map((cap) => (
                  <span key={cap} className="text-[9px] px-1.5 py-0.2 rounded-md surface-input border border-subtle text-muted font-mono">
                    #{cap}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted mt-1 line-clamp-2 leading-relaxed italic">
              "{subagent.systemPrompt.slice(0, 140)}..."
            </p>
          </div>
        </div>

        {subagent.scope === 'repo' || subagent.scope === 'workspace' ? (
          <div className={clsx("flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono shrink-0 select-none shadow-sm",
            subagent.scope === 'repo' ? "bg-amber-500/10 border-amber-500/25 text-amber-300" : "bg-purple-500/10 border-purple-500/25 text-purple-300"
          )}>
            <Lock size={10} />
            <span>{subagent.scope === 'repo' ? 'Repo' : 'Workspace'} Enforced</span>
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
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer border border-subtle", isSwitchActive ? "bg-primary" : "surface-input")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-subtle space-y-1.5 text-[9px] font-mono">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="uppercase font-bold text-cyan-400 tracking-wider">Skills:</span>
          {subagent.allowedSkills.length === 0 ? (
            <span className="text-muted italic">None</span>
          ) : (
            subagent.allowedSkills.slice(0, 3).map((sk) => (
              <span key={sk} className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{sk}</span>
            ))
          )}
          {subagent.allowedSkills.length > 3 && <span className="text-muted">+{subagent.allowedSkills.length - 3}</span>}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <span className="uppercase font-bold text-purple-400 tracking-wider">Rules:</span>
          {allowedRules.length === 0 ? (
            <span className="text-muted italic">Inherited Core</span>
          ) : (
            allowedRules.slice(0, 2).map((r) => (
              <span key={r} className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 truncate max-w-[120px]">{r}</span>
            ))
          )}
          {allowedRules.length > 2 && <span className="text-muted">+{allowedRules.length - 2}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-subtle text-[10px] text-muted font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setTuningAgentProfile(getAgentProfile(subagent.id))} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] transition-colors font-sans cursor-pointer" title="Cấu hình Trí Tuệ, Nỗ Lực Suy Luận & Chi Phí">
            <SlidersHorizontal size={10} /> Profile & Trí Tuệ
          </button>
          <button onClick={() => setAssigningSubagent(subagent)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-[10px] transition-colors font-sans cursor-pointer">
            Skills/Rules
          </button>
          <button onClick={handleChat} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[10px] transition-colors cursor-pointer">
            <MessageSquare size={10} /> Chat
          </button>
        </div>

        {!subagent.isBuiltin && subagent.scope === 'global' && (
          <button onClick={() => { deleteSubagent(subagent.id); addToast(`Removed subagent: ${subagent.name}`, 'info'); }} className="p-1 rounded text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"><Trash2 size={11} /></button>
        )}
      </div>
    </div>
  );
};
