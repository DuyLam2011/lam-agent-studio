import React from 'react';
import { Terminal, Code2, Database, ShieldAlert, Wrench, Globe, Folder, GitBranch, Edit3, Trash2, Lock } from 'lucide-react';
import { AgentSkill } from '../../../types/skills';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface SkillCardProps {
  skill: AgentSkill;
  onEdit: (skill: AgentSkill) => void;
  currentScopeTargetId?: string;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onEdit, currentScopeTargetId }) => {
  const { toggleSkillActive, deleteSkill, addToast } = useAgentStore();
  const tokenEstimate = Math.max(10, Math.round(skill.content.length / 4));
  const isExcluded = Boolean(currentScopeTargetId && skill.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = skill.active && !isExcluded;

  const getScopeBadge = () => {
    switch (skill.scope) {
      case 'global': return <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono"><Globe size={9} /> GLOBAL</span>;
      case 'workspace': return <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono"><Folder size={9} /> WORKSPACE</span>;
      case 'repo': return <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono"><GitBranch size={9} /> REPO</span>;
    }
  };

  const getCategoryIcon = () => {
    switch (skill.category) {
      case 'security': return <ShieldAlert size={14} className="text-rose-400" />;
      case 'architecture': return <Code2 size={14} className="text-cyan-400" />;
      case 'devops': return <Database size={14} className="text-emerald-400" />;
      case 'workflow': return <Terminal size={14} className="text-amber-400" />;
      default: return <Wrench size={14} className="text-primary" />;
    }
  };

  return (
    <div className={clsx(
      "p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5",
      isSwitchActive ? "bg-white/5 border-white/10 hover:border-white/20 shadow-md" : "bg-black/20 border-white/5 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {getCategoryIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-200 truncate">{skill.name}</span>
              {getScopeBadge()}
              {isExcluded && <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">Disabled for this scope</span>}
              {skill.folderName && <span className="text-[9px] text-gray-500 font-mono bg-black/40 px-1 rounded">{skill.folderName}</span>}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{skill.description || 'No description provided.'}</p>
          </div>
        </div>

        {skill.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Repository skills are located in .agents/skills and cannot be toggled off">
            <Lock size={10} className="text-amber-400" />
            <span>Repo Enforced</span>
          </div>
        ) : skill.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Workspace skills are enforced across this workspace and cannot be toggled off">
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
              toggleSkillActive(skill.id, !isSwitchActive, currentScopeTargetId);
            }}
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer", isSwitchActive ? "bg-primary" : "bg-white/10")}
            title={isSwitchActive ? (currentScopeTargetId ? "Active for this scope. Click to disable here." : "Disable Skill") : (isExcluded ? "Disabled for this scope. Click to enable." : "Enable Skill")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-2">
          <span>~{tokenEstimate} tokens</span>
          {skill.filePath && <span className="truncate max-w-[150px] text-gray-400" title={skill.filePath}>{skill.filePath.split(/[/\\]/).pop()}</span>}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(skill)} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-colors">
            <Edit3 size={11} /><span>Edit</span>
          </button>
          {skill.source !== 'builtin' && skill.scope === 'global' && (
            <button
              onClick={() => {
                deleteSkill(skill.id);
                addToast(`Deleted skill: ${skill.name}`, 'info');
              }}
              className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Skill"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
