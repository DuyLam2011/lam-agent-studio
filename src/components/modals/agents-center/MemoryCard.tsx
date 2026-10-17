import React from 'react';
import { Pin, Bookmark, Globe, Folder, GitBranch, Trash2, Lock } from 'lucide-react';
import { ProjectMemoryItem } from '../../../types/memory';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface MemoryCardProps {
  memory: ProjectMemoryItem;
  currentScopeTargetId?: string;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, currentScopeTargetId }) => {
  const { toggleMemoryPinned, deleteMemory, addToast } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && memory.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = memory.pinned && !isExcluded;

  const getScopeBadge = () => {
    switch (memory.scope) {
      case 'global': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1"><Globe size={9} /> GLOBAL</span>;
      case 'workspace': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1"><Folder size={9} /> WORKSPACE</span>;
      case 'repo': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1"><GitBranch size={9} /> REPO</span>;
    }
  };

  const getCategoryBadge = () => {
    const map: Record<string, { label: string; style: string }> = {
      decision: { label: 'ADR Decision', style: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
      architecture: { label: 'Architecture', style: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
      convention: { label: 'Convention', style: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
      gotcha: { label: 'Gotcha / Trap', style: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
      glossary: { label: 'Glossary Term', style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' }
    };
    const c = map[memory.category] || { label: memory.category, style: 'bg-white/10 text-gray-300 border-white/10' };
    return (
      <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full border font-mono uppercase", c.style)}>
        {c.label}
      </span>
    );
  };

  return (
    <div className={clsx(
      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
      isSwitchActive ? "bg-white/5 border-amber-500/30 shadow-lg ring-1 ring-amber-500/20" : "bg-black/20 border-white/5 opacity-80"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={clsx("mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0", isSwitchActive ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-400")}>
            <Bookmark size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-200 truncate">{memory.title}</span>
              {getScopeBadge()}
              {getCategoryBadge()}
              {isExcluded && <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">Disabled for this scope</span>}
            </div>
            <p className="text-[11px] text-gray-300 mt-1.5 whitespace-pre-wrap leading-relaxed font-sans bg-black/30 p-2.5 rounded-xl border border-white/5">{memory.content}</p>
          </div>
        </div>

        {memory.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Repository decisions are committed in project documentation and always pinned">
            <Lock size={10} className="text-amber-400" /><span>Repo Enforced</span>
          </div>
        ) : memory.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Workspace decisions are enforced for this workspace and always pinned">
            <Lock size={10} className="text-purple-400" /><span>Workspace Enforced</span>
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isSwitchActive}
            onClick={(e) => {
              e.stopPropagation();
              toggleMemoryPinned(memory.id, !isSwitchActive, currentScopeTargetId);
            }}
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer", isSwitchActive ? "bg-amber-500" : "bg-white/10")}
            title={isSwitchActive ? (currentScopeTargetId ? "Active for this scope. Click to unpin here." : "Pinned to LLM prompt context.") : (isExcluded ? "Disabled for this scope. Click to pin here." : "Not pinned.")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <Pin size={10} className={clsx(isSwitchActive ? "text-amber-400 fill-amber-400" : "text-gray-500")} />
          {isSwitchActive ? 'Active in Prompt Memory' : 'Available on demand'}
        </span>
        {memory.scope === 'global' && (
          <button
            onClick={() => {
              deleteMemory(memory.id);
              addToast(`Removed memory: ${memory.title}`, 'info');
            }}
            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Memory Item"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};
