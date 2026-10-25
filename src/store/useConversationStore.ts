import { create } from 'zustand';
import { ChatMessage, useAgentStore } from './useAgentStore';
import { Conversation, SecurityMode, createDefaultConversation } from '../types/conversation';

export type { Conversation, SecurityMode };

const STORAGE_KEY = 'lam_agent_conversations_v1';
const ACTIVE_ID_KEY = 'lam_active_conversation_id';

interface ConversationStoreState {
  conversations: Conversation[];
  activeConversationId: string;
  securityMode: SecurityMode;
  initStorage: () => Promise<void>;
  createConversation: (title?: string, workspaceId?: string, workspacePath?: string) => string;
  switchConversation: (id: string) => Promise<void>;
  switchWorkspaceConversation: (workspaceId?: string, workspacePath?: string) => void;
  deleteConversation: (id: string) => void;
  updateActiveTitle: (title: string) => void;
  setSecurityMode: (mode: SecurityMode) => void;
  syncCurrentMessages: (messages: ChatMessage[]) => void;
  getActiveConversation: () => Conversation | undefined;
}

const defaultInitial = createDefaultConversation();

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  conversations: [defaultInitial],
  activeConversationId: defaultInitial.id,
  securityMode: 'guarded',

  initStorage: async () => {
    try {
      // @ts-ignore
      const diskList: any[] = await window.lamApi?.storage?.listConversations?.();
      if (Array.isArray(diskList) && diskList.length > 0) {
        const lastActive = localStorage.getItem(ACTIVE_ID_KEY) || diskList[0].id;
        const validId = diskList.some(c => c.id === lastActive) ? lastActive : diskList[0].id;
        // @ts-ignore
        const fullActive = await window.lamApi?.storage?.getConversation?.(validId);
        set({ conversations: diskList, activeConversationId: validId, securityMode: fullActive?.securityMode || 'guarded' });
        if (fullActive?.messages) useAgentStore.setState({ chatMessages: fullActive.messages });
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const legacy: Conversation[] = JSON.parse(raw);
        for (const c of legacy) {
          // @ts-ignore
          await window.lamApi?.storage?.saveConversation?.(c);
        }
        localStorage.removeItem(STORAGE_KEY);
        set({ conversations: legacy, activeConversationId: legacy[0]?.id || defaultInitial.id });
      }
    } catch (e) {
      console.warn('[ConversationStore] Storage init fallback:', e);
    }
  },

  createConversation: (title = 'New Chat', workspaceId, workspacePath) => {
    const currentModel = useAgentStore.getState().engineSettings.selectedModel || 'gemini-3.5-flash-lite';
    const newConv: Conversation = {
      ...createDefaultConversation(),
      title,
      workspaceId,
      workspacePath,
      model: currentModel,
      securityMode: get().securityMode,
    };
    const nextList = [newConv, ...get().conversations];
    set({ conversations: nextList, activeConversationId: newConv.id });
    localStorage.setItem(ACTIVE_ID_KEY, newConv.id);
    useAgentStore.setState({ chatMessages: [] });
    // @ts-ignore
    window.lamApi?.storage?.saveConversation?.(newConv);
    return newConv.id;
  },

  switchConversation: async (id: string) => {
    const target = get().conversations.find(c => c.id === id);
    if (!target) return;
    set({ activeConversationId: id, securityMode: target.securityMode });
    localStorage.setItem(ACTIVE_ID_KEY, id);
    // @ts-ignore
    const full = await window.lamApi?.storage?.getConversation?.(id);
    useAgentStore.setState({ chatMessages: full?.messages || target.messages || [] });
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
    localStorage.setItem(ACTIVE_ID_KEY, nextActiveId);
    // @ts-ignore
    window.lamApi?.storage?.deleteConversation?.(id);
    get().switchConversation(nextActiveId);
  },

  updateActiveTitle: (title: string) => {
    const { activeConversationId, conversations } = get();
    const updated = conversations.map(c => c.id === activeConversationId ? { ...c, title, updatedAt: Date.now() } : c);
    set({ conversations: updated });
    const target = updated.find(c => c.id === activeConversationId);
    if (target) {
      // @ts-ignore
      window.lamApi?.storage?.saveConversation?.(target);
    }
  },

  setSecurityMode: (mode: SecurityMode) => {
    const { activeConversationId, conversations } = get();
    const updated = conversations.map(c => c.id === activeConversationId ? { ...c, securityMode: mode } : c);
    set({ securityMode: mode, conversations: updated });
  },

  syncCurrentMessages: (messages: ChatMessage[]) => {
    const { activeConversationId, conversations } = get();
    const target = conversations.find(c => c.id === activeConversationId);
    let title = target?.title || 'New Chat';
    if (title === 'New Chat' && messages[0]?.text) {
      title = messages[0].text.slice(0, 32).trim() + (messages[0].text.length > 32 ? '...' : '');
    }
    const fullConv = { ...(target || defaultInitial), id: activeConversationId, title, messages, updatedAt: Date.now() };
    const updated = conversations.map(c => c.id === activeConversationId ? fullConv : c);
    set({ conversations: updated });
    // @ts-ignore
    window.lamApi?.storage?.saveConversation?.(fullConv);
  },

  getActiveConversation: () => {
    const { activeConversationId, conversations } = get();
    return conversations.find(c => c.id === activeConversationId);
  }
}));
