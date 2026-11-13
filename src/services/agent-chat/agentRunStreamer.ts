import { ChatMessage } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useAgentRunStore } from '../../store/useAgentRunStore';
import { makeAgentMsg } from '../reviews/agentReviewOrchestrator';
import { registerLiveMessage, releaseLiveMessage } from './agentEventBridge';
import { finalizeAgentMessage } from './agentEventReducer';

export interface StreamHandle {
  runId: string;
  messageId: string;
  conversationId: string;
  startedAt: number;
  placeholder: ChatMessage;
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const upsertMessage = (conversationId: string, msg: ChatMessage) =>
  useConversationStore.getState().updateConversationMessages(conversationId, (msgs) =>
    msgs.some((m) => m.id === msg.id) ? msgs.map((m) => (m.id === msg.id ? msg : m)) : [...msgs, msg]
  );

export const beginStreamingMessage = (
  conversationId: string,
  agentRole: string,
  extra?: Partial<ChatMessage>
): StreamHandle => {
  const runId = newId('run');
  const messageId = newId('msg');
  const placeholder = makeAgentMsg(agentRole, '', { id: messageId, runId, status: 'streaming', trace: [], ...extra });
  registerLiveMessage(runId, placeholder);
  useAgentRunStore.getState().beginRun({ runId, conversationId, messageId, agentRole });
  void upsertMessage(conversationId, placeholder);
  return { runId, messageId, conversationId, startedAt: Date.now(), placeholder };
};

export const completeStreamingMessage = async (
  handle: StreamHandle,
  final: Partial<ChatMessage>
): Promise<ChatMessage> => {
  const streamed = releaseLiveMessage(handle.runId) || handle.placeholder;
  const finalized = finalizeAgentMessage(streamed, final, handle.startedAt);
  await upsertMessage(handle.conversationId, finalized);
  useAgentRunStore.getState().endRun(handle.runId);
  return finalized;
};

export const responseToMessage = (res: any): Partial<ChatMessage> => ({
  text: res?.text || '',
  thinking: res?.thinking,
  toolCalls: res?.toolCalls,
  diffSnapshots: res?.diffSnapshots,
  status: res?.status,
  model: res?.model,
  durationMs: res?.durationMs
});
