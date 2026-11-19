import React from 'react';
import { Pin, Bookmark, Globe, Folder, GitBranch, Trash2, Lock, Edit3, ExternalLink, FileText } from 'lucide-react';
import { ProjectMemoryItem } from '../../../types/memory';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface MemoryCardProps {
  memory: ProjectMemoryItem;
  currentScopeTargetId?: string;
  onEdit?: (memory: ProjectMemoryItem) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, currentScopeTargetId, onEdit }) => {
  const { toggleMemoryPinned, deleteMemory, addToast, systemContext } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && memory.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = memory.pinned && !isExcluded;
  const activeWsPath = systemContext.workspaces[0]?.folders[0] || '';

  const getScopeBadge = () => {
    switch (memory.scope) {
      case 'global': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1"><Globe size={9} /> GLOBAL</span>;
      case 'workspace': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1"><Folder size={9} /> WORKSPACE</span>;
      case 'repo': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1"><GitBranch size={9} /> REPO</span>;
    }
  };

  const getStatusBadge = () => {
    const status = memory.status || 'accepted';
    const map: Record<string, string> = {
      accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      proposed: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      deprecated: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
      superseded: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    };
    return <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full border font-mono uppercase", map[status] || map.accepted)}>{status}</span>;
  };

  const handleOpenFile = async () => {
    if (!memory.filePath) return;
    try {
      const ok = await window.lamApi?.storage?.openMemoryFile?.(activeWsPath, memory.filePath);
      if (ok) addToast(`Opened ${memory.filePath}`, 'success');
      else addToast(`File not found on disk`, 'info');
    } catch {
      addToast(`Error opening file`, 'error');
    }
  };

  return (
    <div className={clsx(
      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
      isSwitchActive ? "bg-white/5 border-primary/30 shadow-lg ring-1 ring-primary/20" : "bg-black/20 border-white/5 opacity-80"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={clsx("mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0", isSwitchActive ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-400")}>
            <Bookmark size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-200 truncate">{memory.title}</span>
              {getScopeBadge()}
              {getStatusBadge()}
              {memory.filePath && (
                <button onClick={handleOpenFile} className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400 font-mono flex items-center gap-1" title="Open Markdown File">
                  <FileText size={9} /><span>{memory.filePath}</span>
                </button>
              )}
            </div>
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {memory.tags.map(t => <span key={t} className="text-[8px] px-1 rounded bg-white/5 text-gray-400 font-mono">#{t}</span>)}
              </div>
            )}
            <p className="text-[11px] text-gray-300 mt-1.5 whitespace-pre-wrap leading-relaxed font-sans bg-black/30 p-2.5 rounded-xl border border-white/5">{memory.content}</p>
          </div>
        </div>

        {memory.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm">
            <Lock size={10} className="text-amber-400" /><span>Repo Enforced</span>
          </div>
        ) : memory.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm">
            <Lock size={10} className="text-purple-400" /><span>Workspace Enforced</span>
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isSwitchActive}
            onClick={(e) => { e.stopPropagation(); toggleMemoryPinned(memory.id, !isSwitchActive, currentScopeTargetId); }}
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer", isSwitchActive ? "bg-primary" : "bg-white/10")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500 font-mono">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <Pin size={10} className={clsx(isSwitchActive ? "text-primary fill-primary" : "text-gray-500")} />
          {isSwitchActive ? 'Active in Prompt Memory' : 'Available on demand'}
        </span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button onClick={() => onEdit(memory)} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Edit Memory">
              <Edit3 size={11} />
            </button>
          )}
          {memory.filePath && (
            <button onClick={handleOpenFile} className="p-1 rounded text-gray-400 hover:text-cyan-300 hover:bg-white/5 transition-colors" title="Open Markdown File in Editor">
              <ExternalLink size={11} />
            </button>
          )}
          {memory.scope === 'global' && (
            <button onClick={() => { deleteMemory(memory.id); addToast(`Removed memory: ${memory.title}`, 'info'); }} className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete Memory Item">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
