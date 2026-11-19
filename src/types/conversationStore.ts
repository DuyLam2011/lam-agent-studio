import { ChatMessage } from '../store/useAgentStore';
import { Conversation, SecurityMode } from './conversation';

export interface ConversationStoreState {
  conversations: Conversation[];
  activeConversationId: string;
  securityMode: SecurityMode;
  initStorage: () => Promise<void>;
  createConversation: (title?: string, workspaceId?: string, workspacePath?: string) => string;
  forkConversationFromMessage: (messageId: string, customTitle?: string) => string;
  switchConversation: (id: string) => Promise<void>;
  switchWorkspaceConversation: (workspaceId?: string, workspacePath?: string) => void;
  deleteConversation: (id: string) => void;
  updateActiveTitle: (title: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;
  setSecurityMode: (mode: SecurityMode) => void;
  syncCurrentMessages: (messages: ChatMessage[]) => void;
  updateConversationMessages: (conversationId: string, updater: (msgs: ChatMessage[]) => ChatMessage[]) => Promise<void>;
  getActiveConversation: () => Conversation | undefined;
}
