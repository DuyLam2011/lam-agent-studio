import React from 'react';
import { ConversationItemRow } from './ConversationItemRow';

interface UnassignedConversationListProps {
  conversations: any[];
  activeConversationId: string;
  canDelete: boolean;
  onSelect: (conv: any) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const UnassignedConversationList: React.FC<UnassignedConversationListProps> = ({
  conversations,
  activeConversationId,
  canDelete,
  onSelect,
  onDelete,
  onRename,
  onToggleFavorite,
}) => {
  if (conversations.length === 0) return null;

  return (
    <div className="pt-1.5 border-t border-white/5 mt-1.5">
      <div className="px-2 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Default / General ({conversations.length})
      </div>
      <div className="space-y-0.5">
        {conversations.map((c) => (
          <ConversationItemRow
            key={c.id}
            conversation={c}
            isSelected={c.id === activeConversationId}
            canDelete={canDelete}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};
