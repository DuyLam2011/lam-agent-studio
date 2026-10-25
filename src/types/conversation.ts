import { ChatMessage } from '../store/useAgentStore';

export type SecurityMode = 'turbo' | 'guarded' | 'restricted';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  workspaceId?: string;
  workspacePath?: string;
  model: string;
  securityMode: SecurityMode;
  messages: ChatMessage[];
  messageCount?: number;
  lastPreview?: string;
}

export const createDefaultConversation = (): Conversation => ({
  id: `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  title: 'New Chat',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  model: 'gemini-3.5-flash-lite',
  securityMode: 'guarded',
  messages: []
});
