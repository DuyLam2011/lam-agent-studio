import React from 'react';
import { Workflow, Play, Globe, Folder, GitBranch, Trash2, Lock } from 'lucide-react';
import { AgentWorkflowItem } from '../../../types/workflows';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface WorkflowCardProps {
  workflow: AgentWorkflowItem;
  currentScopeTargetId?: string;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, currentScopeTargetId }) => {
  const { toggleWorkflowActive, deleteWorkflow, addToast } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && workflow.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = workflow.active && !isExcluded;

  const getScopeBadge = () => {
    switch (workflow.scope) {
      case 'global': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1"><Globe size={9} /> GLOBAL</span>;
      case 'workspace': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1"><Folder size={9} /> WORKSPACE</span>;
      case 'repo': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1"><GitBranch size={9} /> REPO</span>;
    }
  };

  return (
    <div className={clsx(
      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
      isSwitchActive ? "bg-white/5 border-white/10 hover:border-white/20 shadow-lg" : "bg-black/20 border-white/5 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Workflow size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-200 truncate">{workflow.name}</span>
              {getScopeBadge()}
              {isExcluded && <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">Disabled for this scope</span>}
              <span className="text-[9px] text-gray-400 bg-black/40 px-1.5 py-0.5 rounded font-mono uppercase">{workflow.trigger}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{workflow.description}</p>
          </div>
        </div>

        {workflow.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Repository workflows are anchored to the codebase and always active">
            <Lock size={10} className="text-amber-400" />
            <span>Repo Enforced</span>
          </div>
        ) : workflow.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Workspace workflows are enforced for this workspace and always active">
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
              toggleWorkflowActive(workflow.id, !isSwitchActive, currentScopeTargetId);
            }}
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer", isSwitchActive ? "bg-primary" : "bg-white/10")}
            title={isSwitchActive ? (currentScopeTargetId ? "Active for this scope. Click to disable here." : "Workflow active.") : (isExcluded ? "Disabled for this scope. Click to enable here." : "Workflow paused.")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Pipeline Steps ({workflow.steps.length})</span>
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          {workflow.steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-300 font-mono flex items-center gap-1">
                <span className="text-primary font-bold">{idx + 1}.</span> {step.name}
              </span>
              {idx < workflow.steps.length - 1 && <span className="text-gray-600 text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1 text-emerald-400"><Play size={9} /> Autonomous Execution Ready</span>
        {workflow.scope === 'global' && (
          <button
            onClick={() => {
              deleteWorkflow(workflow.id);
              addToast(`Removed workflow: ${workflow.name}`, 'info');
            }}
            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Workflow"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};
