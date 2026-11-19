import { create } from 'zustand';
import { ChatMessage, useAgentStore } from './useAgentStore';
import { Conversation, SecurityMode, createDefaultConversation } from '../types/conversation';
import { ConversationStoreState } from '../types/conversationStore';
import {
  ACTIVE_ID_KEY, sanitizeLoadedMessages, storageSet, persistConversation,
  initStorageFromDisk, buildForkedConversation, updateBgConversationOnDisk
} from './conversationStorageHelper';

export { sanitizeLoadedMessages };
export type { Conversation, SecurityMode };

const defaultInitial = createDefaultConversation();

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  conversations: [defaultInitial],
  activeConversationId: defaultInitial.id,
  securityMode: 'guarded',

  initStorage: async () => {
    const res = await initStorageFromDisk(defaultInitial);
    if (res) {
      set({ conversations: res.list, activeConversationId: res.activeId, securityMode: res.mode });
      if (res.messages) useAgentStore.setState({ chatMessages: res.messages });
    }
  },

  createConversation: (title = 'New Chat', workspaceId, workspacePath) => {
    const currentModel = useAgentStore.getState().engineSettings.selectedModel || 'gemini-2.5-flash';
    const newConv: Conversation = { ...createDefaultConversation(), title, workspaceId, workspacePath, model: currentModel, securityMode: get().securityMode, isFavorite: false };
    set({ conversations: [newConv, ...get().conversations], activeConversationId: newConv.id });
    storageSet(ACTIVE_ID_KEY, newConv.id);
    useAgentStore.setState({ chatMessages: [] });
    persistConversation(newConv);
    return newConv.id;
  },

  forkConversationFromMessage: (messageId: string, customTitle?: string) => {
    const { forked, branchTitle, sliced } = buildForkedConversation(get().getActiveConversation(), useAgentStore.getState().chatMessages, messageId, customTitle);
    set({ conversations: [forked, ...get().conversations], activeConversationId: forked.id });
    storageSet(ACTIVE_ID_KEY, forked.id);
    useAgentStore.setState({ chatMessages: sliced });
    persistConversation(forked);
    useAgentStore.getState().addToast(`Branched chat into "${branchTitle}"`, 'success');
    return forked.id;
  },

  switchConversation: async (id: string) => {
    const target = get().conversations.find(c => c.id === id);
    if (!target) return;
    set({ activeConversationId: id, securityMode: target.securityMode });
    storageSet(ACTIVE_ID_KEY, id);
    // @ts-ignore
    const full = await window.lamApi?.storage?.getConversation?.(id);
    if (get().activeConversationId !== id) return;
    useAgentStore.setState({ chatMessages: sanitizeLoadedMessages(full?.messages || target.messages || []) });
  },

  switchWorkspaceConversation: (workspaceId?: string, workspacePath?: string) => {
    const existing = get().conversations.find(c => c.workspaceId === workspaceId);
    if (existing) {
      get().switchConversation(existing.id);
    } else {
      const ws = useAgentStore.getState().systemContext.workspaces.find(w => w.id === workspaceId);
      get().createConversation(ws ? `${ws.name} Chat` : 'New Chat', workspaceId, workspacePath || ws?.folders?.[0]);
    }
  },

  deleteConversation: (id: string) => {
    const filtered = get().conversations.filter(c => c.id !== id);
    const nextList = filtered.length > 0 ? filtered : [createDefaultConversation()];
    const nextActiveId = nextList[0].id;
    set({ conversations: nextList, activeConversationId: nextActiveId });
    storageSet(ACTIVE_ID_KEY, nextActiveId);
    // @ts-ignore
    window.lamApi?.storage?.deleteConversation?.(id);
    get().switchConversation(nextActiveId);
  },

  updateConversationTitle: (id: string, title: string) => {
    const cleanTitle = title.trim() || 'Untitled Chat';
    const updated = get().conversations.map(c => c.id === id ? { ...c, title: cleanTitle, updatedAt: Date.now() } : c);
    set({ conversations: updated });
    const target = updated.find(c => c.id === id);
    if (target) persistConversation(target);
    useAgentStore.getState().addToast(`Renamed chat to "${cleanTitle}"`, 'success');
  },

  updateActiveTitle: (title: string) => get().updateConversationTitle(get().activeConversationId, title),

  toggleFavorite: (id: string) => {
    let nextFav = false;
    let targetTitle = 'Chat';
    const updated = get().conversations.map(c => {
      if (c.id === id) {
        nextFav = !c.isFavorite;
        targetTitle = c.title;
        return { ...c, isFavorite: nextFav, updatedAt: Date.now() };
      }
      return c;
    });
    set({ conversations: updated });
    const target = updated.find(c => c.id === id);
    if (target) persistConversation(target);
    useAgentStore.getState().addToast(nextFav ? `Favorited "${targetTitle}" ⭐` : `Removed "${targetTitle}" from favorites`, 'info');
  },

  setSecurityMode: (mode: SecurityMode) => {
    set({ securityMode: mode, conversations: get().conversations.map(c => c.id === get().activeConversationId ? { ...c, securityMode: mode } : c) });
  },

  syncCurrentMessages: (messages: ChatMessage[]) => {
    const { activeConversationId, conversations } = get();
    const target = conversations.find(c => c.id === activeConversationId);
    let title = target?.title || 'New Chat';
    if (title === 'New Chat' && messages[0]?.text) {
      title = messages[0].text.slice(0, 32).trim() + (messages[0].text.length > 32 ? '...' : '');
    }
    const fullConv = { ...(target || defaultInitial), id: activeConversationId, title, messages, updatedAt: Date.now() };
    set({ conversations: conversations.map(c => c.id === activeConversationId ? fullConv : c) });
    persistConversation(fullConv);
  },

  updateConversationMessages: async (conversationId, updater) => {
    if (get().activeConversationId === conversationId) {
      const next = updater(useAgentStore.getState().chatMessages);
      useAgentStore.setState({ chatMessages: next });
      get().syncCurrentMessages(next);
      return;
    }
    const updatedTime = await updateBgConversationOnDisk(conversationId, get().conversations, updater);
    if (updatedTime) {
      set({ conversations: get().conversations.map(c => c.id === conversationId ? { ...c, updatedAt: updatedTime } : c) });
    }
  },

  getActiveConversation: () => get().conversations.find(c => c.id === get().activeConversationId)
}));
