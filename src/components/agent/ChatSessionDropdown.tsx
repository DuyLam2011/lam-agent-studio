import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useConversationStore } from '../../store/useConversationStore';
import { useAgentStore } from '../../store/useAgentStore';
import { getWorkspaceDisplayName } from './ChatWorkspaceSelector';
import { WorkspaceConversationGroup } from './session/WorkspaceConversationGroup';
import { FavoriteConversationList } from './session/FavoriteConversationList';
import { UnassignedConversationList } from './session/UnassignedConversationList';
import { ChatSessionDropdownTrigger } from './session/ChatSessionDropdownTrigger';

export const ChatSessionDropdown: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    switchConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    toggleFavorite,
    getActiveConversation
  } = useConversationStore();
  const { systemContext, setActiveWorkspace } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConv = getActiveConversation();
  const activeWs = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const activeWsName = getWorkspaceDisplayName(activeWs);

  const currentTitle = useMemo(() => {
    if (!activeConv) return 'New Chat';
    return activeConv.title === 'Untitled Workspace Chat' ? `${activeWsName} Chat` : activeConv.title;
  }, [activeConv, activeWsName]);

  const workspaces = systemContext.workspaces;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleStartInWs = (wsId?: string, wsName?: string, wsPath?: string) => {
    if (wsId) setActiveWorkspace(wsId);
    createConversation(wsName ? `${wsName} Chat` : 'New Chat', wsId, wsPath);
    setIsOpen(false);
  };

  const handleSelectConv = (c: any) => {
    if (c.workspaceId) setActiveWorkspace(c.workspaceId);
    switchConversation(c.id);
    setIsOpen(false);
  };

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || (c.workspacePath || '').toLowerCase().includes(q));
  }, [conversations, search]);

  const favoriteConvs = useMemo(() => filteredConvs.filter((c) => c.isFavorite), [filteredConvs]);
  const unassigned = filteredConvs.filter((c) => !c.workspaceId || !workspaces.some((w) => w.id === c.workspaceId));

  return (
    <div className="relative flex items-center gap-1" ref={dropdownRef}>
      <ChatSessionDropdownTrigger
        currentTitle={currentTitle}
        isFavorite={activeConv?.isFavorite}
        isOpen={isOpen}
        onToggleOpen={() => setIsOpen(!isOpen)}
        onToggleFavorite={() => activeConv && toggleFavorite(activeConv.id)}
        onNewChat={() => handleStartInWs(systemContext.activeWorkspaceId || undefined, activeWsName, activeWs?.folders?.[0])}
      />

      {isOpen && (
        <div className="surface-dropdown absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto custom-scrollbar p-2 z-50 animate-in fade-in zoom-in-95 duration-100 shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/5 mb-2">
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Conversations by Workspace</span>
            <button
              onClick={() => handleStartInWs(systemContext.activeWorkspaceId || undefined, activeWsName, activeWs?.folders?.[0])}
              className="text-primary hover:underline text-[10px] flex items-center gap-0.5 font-medium"
            >
              <Plus size={10} /> New Chat
            </button>
          </div>

          <div className="relative mb-2">
            <Search size={11} className="absolute left-2.5 top-2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full surface-input rounded-lg py-1 pl-7 pr-2 text-[11px] focus:outline-none focus:border-primary/50 placeholder-gray-500"
            />
          </div>

          <FavoriteConversationList
            favorites={favoriteConvs}
            activeConversationId={activeConversationId}
            canDelete={conversations.length > 1}
            onSelectConv={handleSelectConv}
            onDeleteConv={deleteConversation}
            onRenameConv={updateConversationTitle}
            onToggleFavorite={toggleFavorite}
          />

          {workspaces.map((ws) => (
            <WorkspaceConversationGroup
              key={ws.id}
              workspace={ws}
              displayName={getWorkspaceDisplayName(ws)}
              conversations={filteredConvs.filter((c) => c.workspaceId === ws.id)}
              isActiveWs={ws.id === systemContext.activeWorkspaceId}
              activeConversationId={activeConversationId}
              canDelete={conversations.length > 1}
              onSelectConv={handleSelectConv}
              onDeleteConv={deleteConversation}
              onRenameConv={updateConversationTitle}
              onToggleFavorite={toggleFavorite}
              onNewChat={handleStartInWs}
            />
          ))}

          <UnassignedConversationList
            conversations={unassigned}
            activeConversationId={activeConversationId}
            canDelete={conversations.length > 1}
            onSelect={handleSelectConv}
            onDelete={deleteConversation}
            onRename={updateConversationTitle}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      )}
    </div>
  );
};
