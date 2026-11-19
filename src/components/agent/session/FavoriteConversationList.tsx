import React from 'react';
import { Star } from 'lucide-react';
import { ConversationItemRow } from './ConversationItemRow';

interface FavoriteConversationListProps {
  favorites: any[];
  activeConversationId: string;
  canDelete: boolean;
  onSelectConv: (conv: any) => void;
  onDeleteConv: (id: string) => void;
  onRenameConv: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const FavoriteConversationList: React.FC<FavoriteConversationListProps> = ({
  favorites,
  activeConversationId,
  canDelete,
  onSelectConv,
  onDeleteConv,
  onRenameConv,
  onToggleFavorite,
}) => {
  if (favorites.length === 0) return null;

  return (
    <div className="mb-2 pb-1.5 border-b border-white/5">
      <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
        <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
        <span>Favorites ({favorites.length})</span>
      </div>
      <div className="space-y-0.5 mt-1">
        {favorites.map((c) => (
          <ConversationItemRow
            key={`fav-${c.id}`}
            conversation={c}
            isSelected={c.id === activeConversationId}
            canDelete={canDelete}
            onSelect={onSelectConv}
            onDelete={onDeleteConv}
            onRename={onRenameConv}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};
