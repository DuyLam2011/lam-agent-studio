import { ChatMessage, useAgentStore } from './useAgentStore';
import { useAgentRunStore } from './useAgentRunStore';
import { Conversation, SecurityMode, createDefaultConversation } from '../types/conversation';

export const STORAGE_KEY = 'lam_agent_conversations_v1';
export const ACTIVE_ID_KEY = 'lam_active_conversation_id';

export const sanitizeLoadedMessages = (messages: ChatMessage[] = []): ChatMessage[] => {
  const liveRunId = useAgentRunStore.getState().activeRun?.runId;
  return messages.map((m) =>
    m.status === 'streaming' && m.runId !== liveRunId
      ? { ...m, status: 'cancelled' as const, error: m.error || 'Interrupted before completion' }
      : m
  );
};

export const storageGet = (k: string) => typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
export const storageSet = (k: string, v: string) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); };
export const storageRemove = (k: string) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); };

export const persistConversation = (conv: Conversation): void => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.lamApi?.storage?.saveConversation?.(conv);
  }
};

export const initStorageFromDisk = async (
  defaultInitial: Conversation
): Promise<{ list: Conversation[]; activeId: string; mode: SecurityMode; messages?: ChatMessage[] } | null> => {
  try {
    // @ts-ignore
    const diskList: any[] = await window.lamApi?.storage?.listConversations?.();
    if (Array.isArray(diskList) && diskList.length > 0) {
      const lastActive = storageGet(ACTIVE_ID_KEY) || diskList[0].id;
      const validId = diskList.some(c => c.id === lastActive) ? lastActive : diskList[0].id;
      // @ts-ignore
      const fullActive = await window.lamApi?.storage?.getConversation?.(validId);
      return {
        list: diskList,
        activeId: validId,
        mode: fullActive?.securityMode || 'guarded',
        messages: sanitizeLoadedMessages(fullActive?.messages || [])
      };
    }
    const raw = storageGet(STORAGE_KEY);
    if (raw) {
      const legacy: Conversation[] = JSON.parse(raw);
      for (const c of legacy) persistConversation(c);
      storageRemove(STORAGE_KEY);
      return { list: legacy, activeId: legacy[0]?.id || defaultInitial.id, mode: 'guarded' };
    }
  } catch (e) {
    console.warn('[ConversationStore] Storage init fallback:', e);
  }
  return null;
};

export const buildForkedConversation = (
  active: Conversation | undefined,
  currentMessages: ChatMessage[],
  messageId: string,
  customTitle?: string
): { forked: Conversation; branchTitle: string; sliced: ChatMessage[] } => {
  const targetIdx = currentMessages.findIndex((m) => m.id === messageId);
  const sliced = targetIdx !== -1 ? currentMessages.slice(0, targetIdx + 1) : currentMessages;
  const branchTitle = customTitle || `Branch of ${active?.title || 'Chat'} (#${sliced.length})`;
  const forked: Conversation = {
    ...createDefaultConversation(),
    title: branchTitle,
    workspaceId: active?.workspaceId,
    workspacePath: active?.workspacePath,
    model: active?.model || useAgentStore.getState().engineSettings.selectedModel || 'gemini-2.5-flash',
    securityMode: active?.securityMode || 'guarded',
    messages: sliced,
    messageCount: sliced.length,
    isFavorite: false
  };
  return { forked, branchTitle, sliced };
};

export const updateBgConversationOnDisk = async (
  conversationId: string,
  conversations: Conversation[],
  updater: (msgs: ChatMessage[]) => ChatMessage[]
): Promise<number | null> => {
  try {
    // @ts-ignore
    const full: Conversation | null = await window.lamApi?.storage?.getConversation?.(conversationId);
    const base = full || conversations.find(c => c.id === conversationId);
    if (!base) return null;
    const updatedConv = { ...base, messages: updater(base.messages || []), updatedAt: Date.now() };
    persistConversation(updatedConv);
    return updatedConv.updatedAt;
  } catch (e) {
    console.warn('[ConversationStore] Background update failed:', e);
    return null;
  }
};
