import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { useConversationStore, sanitizeLoadedMessages } from '../../store/useConversationStore';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInputArea } from './ChatInputArea';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatTopAlerts } from './ChatTopAlerts';
import { ChatContextBudgetBar } from './context/ChatContextBudgetBar';
import { ChatSearchBar } from './context/ChatSearchBar';
import { SideThreadDrawer } from './thread/SideThreadDrawer';
import { DecisionCenterHud } from './decision-center/DecisionCenterHud';
import { DecisionCenterModal } from './decision-center/DecisionCenterModal';
import { filterChatMessages, ChatFilterState } from '../../services/agent-chat/chatFilterService';
import { useAgentChatRunner } from './useAgentChatRunner';

const STICK_THRESHOLD = 80;

const ChatTab: React.FC = () => {
  const chatMessages = useAgentStore((s) => s.chatMessages);
  const { getActiveConversation } = useConversationStore();
  const { isThinking, handleSendMessage, cancelRun } = useAgentChatRunner();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevCount = useRef(chatMessages.length);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDecisionCenterModalOpen, setIsDecisionCenterModalOpen] = useState(false);
  const [filter, setFilter] = useState<ChatFilterState>({ query: '', roleFilter: 'all', hasDiffOnly: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (chatMessages.length > prevCount.current) stickToBottom.current = true;
    prevCount.current = chatMessages.length;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    const active = getActiveConversation();
    if (active?.messages?.length && useAgentStore.getState().chatMessages.length === 0) {
      useAgentStore.setState({ chatMessages: sanitizeLoadedMessages(active.messages) });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
  };

  const filteredMessages = useMemo(() => {
    if (!isSearchOpen && !filter.query && filter.roleFilter === 'all' && !filter.hasDiffOnly) {
      return chatMessages;
    }
    return filterChatMessages(chatMessages, filter);
  }, [chatMessages, isSearchOpen, filter]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <ChatTopAlerts />

      <ChatContextBudgetBar
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen(prev => !prev)}
      />

      <DecisionCenterHud onOpenDetails={() => setIsDecisionCenterModalOpen(true)} />

      {isSearchOpen && (
        <ChatSearchBar
          filter={filter}
          onFilterChange={(patch) => setFilter(prev => ({ ...prev, ...patch }))}
          matchesCount={filteredMessages.length}
          totalCount={chatMessages.length}
          onClose={() => { setIsSearchOpen(false); setFilter({ query: '', roleFilter: 'all', hasDiffOnly: false }); }}
        />
      )}

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {chatMessages.length === 0 ? (
          <ChatEmptyState onSelectPrompt={handleSendMessage} />
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-app-muted">Không tìm thấy tin nhắn nào khớp với bộ lọc.</p>
            <button
              type="button"
              onClick={() => setFilter({ query: '', roleFilter: 'all', hasDiffOnly: false })}
              className="px-3 py-1 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          filteredMessages.map((msg) => <ChatMessageItem key={msg.id} message={msg} />)
        )}
      </div>

      <ChatInputArea onSendMessage={handleSendMessage} onStop={cancelRun} isThinking={isThinking} />

      {/* Focused Side Thread Discussion Drawer */}
      <SideThreadDrawer />

      {/* Decision Center Tool Optimization Detail Modal */}
      <DecisionCenterModal isOpen={isDecisionCenterModalOpen} onClose={() => setIsDecisionCenterModalOpen(false)} />
    </div>
  );
};

export default ChatTab;
