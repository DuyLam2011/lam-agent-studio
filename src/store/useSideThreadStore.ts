import { create } from 'zustand';
import { ChatMessage, useAgentStore } from './useAgentStore';

export interface SideThreadMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
  status?: 'streaming' | 'completed' | 'failed';
  thinking?: string;
}

interface SideThreadStoreState {
  activeThreadMessageId: string | null;
  rootMessage: ChatMessage | null;
  isDrawerOpen: boolean;
  threads: Record<string, SideThreadMessage[]>;
  isThinking: boolean;
  openSideThread: (message: ChatMessage) => void;
  closeSideThread: () => void;
  sendThreadMessage: (text: string) => Promise<void>;
  clearThread: (messageId: string) => void;
  promoteThreadToMainChat: (messageId: string) => void;
  getThreadMessageCount: (messageId: string) => number;
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const useSideThreadStore = create<SideThreadStoreState>((set, get) => ({
  activeThreadMessageId: null,
  rootMessage: null,
  isDrawerOpen: false,
  threads: {},
  isThinking: false,

  openSideThread: (message: ChatMessage) => {
    set({
      activeThreadMessageId: message.id,
      rootMessage: message,
      isDrawerOpen: true
    });
  },

  closeSideThread: () => {
    set({ isDrawerOpen: false });
  },

  getThreadMessageCount: (messageId: string) => {
    return get().threads[messageId]?.length || 0;
  },

  clearThread: (messageId: string) => {
    set(state => {
      const next = { ...state.threads };
      delete next[messageId];
      return { threads: next };
    });
  },

  promoteThreadToMainChat: (messageId: string) => {
    const thread = get().threads[messageId];
    const root = get().rootMessage;
    if (!thread || thread.length === 0) return;

    const summaryText = [
      `💬 **Summary from Side Thread (Anchored to ${root?.agentRole || 'Message'} #${messageId.slice(0, 8)}):**`,
      ...thread.map(m => `> **${m.role === 'user' ? 'User' : 'AI'}**: ${m.text}`)
    ].join('\n\n');

    useAgentStore.getState().addChatMessage({
      id: newId('msg'),
      role: 'agent',
      agentRole: 'lead-architect',
      text: summaryText,
      timestamp: Date.now(),
      status: 'completed'
    });

    useAgentStore.getState().addToast('Promoted side thread discussion to main conversation', 'success');
    set({ isDrawerOpen: false });
  },

  sendThreadMessage: async (text: string) => {
    const { activeThreadMessageId, rootMessage, threads, isThinking } = get();
    if (!activeThreadMessageId || !rootMessage || !text.trim() || isThinking) return;

    const userMsg: SideThreadMessage = { id: newId('tmsg'), role: 'user', text: text.trim(), timestamp: Date.now() };
    const currentThread = threads[activeThreadMessageId] || [];
    set(state => ({ isThinking: true, threads: { ...state.threads, [activeThreadMessageId]: [...currentThread, userMsg] } }));

    const agentSettings = useAgentStore.getState().engineSettings;
    const prompt = [
      `You are collaborating in a focused Side Thread on a specific message/topic.`,
      `Root Message [${rootMessage.agentRole || rootMessage.role}]: """\n${rootMessage.text}\n"""`,
      `Thread History:`, ...currentThread.map(m => `[${m.role}]: ${m.text}`), `[user]: ${text}`,
      `Answer directly, focusing precisely on the root context and user inquiry.`
    ].join('\n');

    const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
    let replyText = 'Tôi đã nhận được câu hỏi trong luồng phụ và đang tập trung phân tích nội dung này.';
    if (ai) {
      try {
        const res = await ai.sendPrompt(prompt, {
          model: agentSettings.selectedModel, mode: agentSettings.mode, persona: agentSettings.persona,
          apiKey: agentSettings.customApiKey || undefined, provider: agentSettings.provider
        });
        if (res?.text) replyText = res.text;
      } catch (err: any) {
        replyText = `Lỗi trong luồng phụ: ${err?.message || 'Không thể kết nối AI'}`;
      }
    }

    const agentMsg: SideThreadMessage = { id: newId('tmsg'), role: 'agent', text: replyText, timestamp: Date.now(), status: 'completed' };
    set(state => ({
      isThinking: false,
      threads: { ...state.threads, [activeThreadMessageId]: [...(state.threads[activeThreadMessageId] || []), agentMsg] }
    }));
  }
}));
