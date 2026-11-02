import React from 'react';
import { MessageSquare, Trash2, Check } from 'lucide-react';

interface ConversationItemRowProps {
  conversation: any;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: (conv: any) => void;
  onDelete: (id: string) => void;
}

export const ConversationItemRow: React.FC<ConversationItemRowProps> = ({
  conversation: c,
  isSelected,
  canDelete,
  onSelect,
  onDelete
}) => {
  const msgCount = c.messages?.length || 0;

  return (
    <div
      onClick={() => onSelect(c)}
      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/20 text-primary font-medium border border-primary/30' : 'hover:bg-white/10 text-app-sub hover:text-app-text'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-1">
        {isSelected ? <Check size={12} className="text-primary shrink-0" /> : <MessageSquare size={12} className="opacity-40 shrink-0" />}
        <div className="truncate">
          <span className="truncate font-medium text-xs text-app-text block">{c.title}</span>
          {msgCount > 0 && <span className="text-[9px] text-gray-500 font-mono block">{msgCount} msg{msgCount > 1 ? 's' : ''}</span>}
        </div>
      </div>
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 shrink-0 transition-opacity"
          title="Delete session"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
};
