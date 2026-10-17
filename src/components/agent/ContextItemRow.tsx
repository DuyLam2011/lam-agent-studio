import React from 'react';
import { FileCode, GitCompare, Pin, Trash2 } from 'lucide-react';
import { ContextAttachment } from '../../store/useAgentStore';
import clsx from 'clsx';

interface ContextItemRowProps {
  item: ContextAttachment;
  onTogglePin: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ContextItemRow: React.FC<ContextItemRowProps> = ({ item, onTogglePin, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300">
      <div className="flex items-center gap-2 truncate">
        {item.type === 'diff' ? (
          <GitCompare size={12} className="text-amber-400 shrink-0" />
        ) : (
          <FileCode size={12} className="text-primary shrink-0" />
        )}
        <span className="truncate font-mono text-[11px]">{item.name}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] text-gray-500 font-mono">~{item.tokenEstimate} tok</span>
        <button
          onClick={() => onTogglePin(item.id)}
          className={clsx("p-1 rounded hover:bg-white/10 transition-colors", item.pinned ? "text-primary" : "text-gray-500")}
          title={item.pinned ? "Pinned in context" : "Unpinned"}
        >
          <Pin size={11} />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
          title="Remove from context"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};
