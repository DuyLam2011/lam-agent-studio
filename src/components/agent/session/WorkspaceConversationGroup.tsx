import React from 'react';
import { Folder, Plus } from 'lucide-react';
import { ConversationItemRow } from './ConversationItemRow';

interface WorkspaceConversationGroupProps {
  workspace: any;
  displayName: string;
  conversations: any[];
  isActiveWs: boolean;
  activeConversationId: string;
  canDelete: boolean;
  onSelectConv: (conv: any) => void;
  onDeleteConv: (id: string) => void;
  onNewChat: (wsId: string, wsName: string, wsPath?: string) => void;
}

export const WorkspaceConversationGroup: React.FC<WorkspaceConversationGroupProps> = ({
  workspace: ws,
  displayName: wsName,
  conversations: wsConvs,
  isActiveWs,
  activeConversationId,
  canDelete,
  onSelectConv,
  onDeleteConv,
  onNewChat
}) => {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className={`flex items-center justify-between px-2 py-1 text-[11px] font-semibold rounded-lg ${isActiveWs ? 'bg-primary/15 text-primary border border-primary/20' : 'text-gray-300 bg-white/5'}`}>
        <div className="flex items-center gap-1.5 truncate">
          <Folder size={12} className={isActiveWs ? 'text-primary shrink-0' : 'text-blue-400 shrink-0'} />
          <span className="truncate">{wsName}</span>
          <span className="text-[9px] text-gray-400 font-mono">({wsConvs.length})</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onNewChat(ws.id, wsName, ws.folders?.[0]); }}
          className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-normal"
          title={`New chat in ${wsName}`}
        >
          <Plus size={10} />
        </button>
      </div>

      <div className="pl-1 mt-1 space-y-0.5">
        {wsConvs.length === 0 ? (
          <div className="px-3 py-1 text-[10px] text-gray-500 italic flex items-center justify-between">
            <span>No chats yet</span>
            <button onClick={() => onNewChat(ws.id, wsName, ws.folders?.[0])} className="text-primary hover:underline text-[10px]">Start</button>
          </div>
        ) : (
          wsConvs.map((c) => (
            <ConversationItemRow
              key={c.id}
              conversation={c}
              isSelected={c.id === activeConversationId}
              canDelete={canDelete}
              onSelect={onSelectConv}
              onDelete={onDeleteConv}
            />
          ))
        )}
      </div>
    </div>
  );
};
