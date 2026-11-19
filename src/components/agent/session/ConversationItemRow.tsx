import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Trash2, Check, Star, Pencil, X } from 'lucide-react';

interface ConversationItemRowProps {
  conversation: any;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: (conv: any) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export const ConversationItemRow: React.FC<ConversationItemRowProps> = ({
  conversation: c,
  isSelected,
  canDelete,
  onSelect,
  onDelete,
  onRename,
  onToggleFavorite,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(c.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgCount = c.messages?.length || c.messageCount || 0;

  useEffect(() => { setEditTitle(c.title); }, [c.title]);
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = editTitle.trim();
    if (clean && clean !== c.title) onRename?.(c.id, clean);
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(c.title);
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(c)}
      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary/20 text-primary font-medium border border-primary/30'
          : 'hover:bg-white/10 text-app-sub hover:text-app-text'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
        {isSelected ? <Check size={12} className="text-primary shrink-0" /> : <MessageSquare size={12} className="opacity-40 shrink-0" />}

        {isEditing ? (
          <form onSubmit={handleSave} className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); handleCancel(e as any); } }}
              className="surface-input px-1.5 py-0.5 rounded text-xs w-full text-app-text focus:outline-none focus:border-primary border border-primary/40"
            />
            <button type="submit" className="p-0.5 text-emerald-400 hover:bg-emerald-500/20 rounded" title="Save"><Check size={11} /></button>
            <button type="button" onClick={handleCancel} className="p-0.5 text-gray-400 hover:bg-white/10 rounded" title="Cancel"><X size={11} /></button>
          </form>
        ) : (
          <div className="truncate flex-1" onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Double-click to rename">
            <span className="truncate font-medium text-xs text-app-text block">{c.title}</span>
            {msgCount > 0 && <span className="text-[9px] text-gray-500 font-mono block">{msgCount} msg{msgCount > 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(c.id); }}
            className={`p-1 rounded transition-colors ${c.isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-amber-400'}`}
            title={c.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
          >
            <Star size={12} className={c.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-primary transition-opacity"
            title="Rename chat"
          >
            <Pencil size={11} />
          </button>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-opacity"
              title="Delete session"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
