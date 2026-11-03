import React from 'react';
import { FileCode, Folder, GitCompare, Pin, Trash2 } from 'lucide-react';
import { ContextAttachment } from '../../store/useAgentStore';
import { openFileInEditor } from '../../services/workspace/workspaceFileService';
import clsx from 'clsx';

interface ContextItemRowProps {
  item: ContextAttachment;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ContextItemRow: React.FC<ContextItemRowProps> = ({ item, onTogglePin, onRemove }) => {
  const displayPath = item.rootPath || item.relativePath || item.path;

  return (
    <div
      onClick={() => openFileInEditor(item.path, item.name, item.lineRange?.startLine)}
      className="flex items-center justify-between p-2 rounded-lg bg-black/40 hover:bg-white/5 border border-white/5 hover:border-white/10 text-xs text-gray-300 cursor-pointer transition-all group"
      title={`${item.workspaceRepoTag ? `(${item.workspaceRepoTag}) ` : ''}Root: ${displayPath} (Click to open)`}
    >
      <div className="flex items-center gap-2 truncate min-w-0">
        {item.type === 'diff' ? (
          <GitCompare size={12} className="text-amber-400 shrink-0" />
        ) : item.type === 'folder' ? (
          <Folder size={12} className="text-amber-400 shrink-0" />
        ) : (
          <FileCode size={12} className="text-primary shrink-0" />
        )}
        <div className="truncate min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate font-mono text-[11px] group-hover:text-primary transition-colors">
              {item.name}
            </span>
            {item.workspaceRepoTag && (
              <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-500/20 shrink-0">
                ({item.workspaceRepoTag})
              </span>
            )}
          </div>
          {displayPath && displayPath !== item.name && (
            <span className="text-[9px] text-gray-500 font-mono truncate block" title={displayPath}>
              {displayPath}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] text-gray-500 font-mono">~{item.tokenEstimate} tok</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(item.id);
          }}
          className={clsx("p-1 rounded hover:bg-white/10 transition-colors", item.pinned ? "text-primary" : "text-gray-500")}
          title={item.pinned ? "Pinned in context" : "Unpinned"}
        >
          <Pin size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
          title="Remove from context"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};
