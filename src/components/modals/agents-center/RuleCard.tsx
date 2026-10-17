import React from 'react';
import { FileText, Globe, Folder, GitBranch, Sparkles, Edit3, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { AgentRule } from '../../../types/rules';
import clsx from 'clsx';

interface RuleCardProps {
  rule: AgentRule;
  onToggle: (id: string, active: boolean, targetScopeId?: string) => void;
  onEdit: (rule: AgentRule) => void;
  onDelete?: (id: string) => void;
  currentScopeTargetId?: string;
}

export const RuleCard: React.FC<RuleCardProps> = ({ rule, onToggle, onEdit, onDelete, currentScopeTargetId }) => {
  const isExcluded = Boolean(currentScopeTargetId && rule.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = rule.active && !isExcluded;

  const getScopeBadge = () => {
    switch (rule.scope) {
      case 'global':
        return <span className="flex items-center gap-1 text-[9px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full font-mono"><Globe size={10} /> Global</span>;
      case 'workspace':
        return <span className="flex items-center gap-1 text-[9px] bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full font-mono"><Folder size={10} /> Workspace</span>;
      case 'repo':
        return <span className="flex items-center gap-1 text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono"><GitBranch size={10} /> Repo</span>;
    }
  };

  const getSourceIcon = () => {
    if (rule.source === 'file') return <FileText size={14} className="text-amber-400 shrink-0" />;
    if (rule.source === 'ai-generated') return <Sparkles size={14} className="text-purple-400 shrink-0" />;
    return <Edit3 size={14} className="text-blue-400 shrink-0" />;
  };

  return (
    <div className={clsx(
      "p-3 rounded-xl border transition-all flex flex-col gap-2.5",
      isSwitchActive ? "bg-white/5 border-white/10 hover:border-white/20 shadow-md" : "bg-black/20 border-white/5 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5">{getSourceIcon()}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold text-gray-200 truncate">{rule.name}</h4>
              {getScopeBadge()}
              {isExcluded && (
                <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">
                  Disabled for this scope
                </span>
              )}
              {rule.source === 'file' && (
                <span className="text-[9px] text-gray-500 font-mono truncate max-w-[120px]">
                  {rule.filePath ? rule.filePath.split(/[/\\]/).pop() : 'file'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{rule.description}</p>
          </div>
        </div>

        {/* Lock badge for repo/workspace or interactive switch for global */}
        {rule.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Repository rules are committed to the codebase and always enforced">
            <Lock size={10} className="text-amber-400" />
            <span>Repo Enforced</span>
          </div>
        ) : rule.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Workspace directives are enforced across this workspace and cannot be disabled">
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
              onToggle(rule.id, !isSwitchActive, currentScopeTargetId);
            }}
            className={clsx(
              "w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer",
              isSwitchActive ? "bg-primary" : "bg-white/10"
            )}
            title={isSwitchActive ? (currentScopeTargetId ? "Active for this scope. Click to disable here." : "Rule active globally.") : (isExcluded ? "Disabled for this scope. Click to enable here." : "Rule disabled globally.")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
        <div className="flex items-center gap-2 text-gray-500 font-mono">
          <span>~{Math.ceil((rule.content.length || 0) / 3.8)} tokens</span>
          {isSwitchActive && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={10} /> Active</span>}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(rule)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center gap-1 transition-colors">
            <Edit3 size={11} /><span>View / Edit</span>
          </button>
          {onDelete && rule.source !== 'file' && rule.scope === 'global' && (
            <button onClick={() => onDelete(rule.id)} className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors" title="Delete custom rule">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
