import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useAgentRunStore } from '../../store/useAgentRunStore';
import { makeAgentMsg, runPostCodeReviewWorkflow, runTaggedSubagentWorkflow } from '../reviews/agentReviewOrchestrator';
import { detectComboTrigger } from '../combos/agentComboOrchestrator';
import { runComboTeamWorkflow } from '../combos/agentComboRunner';
import { detectDelegationTrigger, runLeadDelegationWorkflow } from '../lead-agent/leadDelegationOrchestrator';
import { buildHistoryPayload } from './chatHistoryBuilder';
import { ensureAgentEventBridge, registerLiveMessage, releaseLiveMessage } from './agentEventBridge';
import { finalizeAgentMessage } from './agentEventReducer';
import { buildLeadOptions, sendPromptSafely } from './leadOptionsBuilder';

interface StreamHandle {
  runId: string;
  messageId: string;
  conversationId: string;
  startedAt: number;
  placeholder: ChatMessage;
}

class PipelineCancelled extends Error {}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
let pipelineCancelled = false;

const upsertMessage = (conversationId: string, msg: ChatMessage) =>
  useConversationStore.getState().updateConversationMessages(conversationId, (msgs) =>
    msgs.some((m) => m.id === msg.id) ? msgs.map((m) => (m.id === msg.id ? msg : m)) : [...msgs, msg]
  );

const beginStreamingMessage = (conversationId: string, agentRole: string, extra?: Partial<ChatMessage>): StreamHandle => {
  if (pipelineCancelled) throw new PipelineCancelled();
  const runId = newId('run');
  const messageId = newId('msg');
  const placeholder = makeAgentMsg(agentRole, '', { id: messageId, runId, status: 'streaming', trace: [], ...extra });
  registerLiveMessage(runId, placeholder);
  useAgentRunStore.getState().beginRun({ runId, conversationId, messageId, agentRole });
  void upsertMessage(conversationId, placeholder);
  return { runId, messageId, conversationId, startedAt: Date.now(), placeholder };
};

const completeStreamingMessage = async (handle: StreamHandle, final: Partial<ChatMessage>): Promise<ChatMessage> => {
  const streamed = releaseLiveMessage(handle.runId) || handle.placeholder;
  const finalized = finalizeAgentMessage(streamed, final, handle.startedAt);
  await upsertMessage(handle.conversationId, finalized);
  useAgentRunStore.getState().endRun(handle.runId);
  return finalized;
};

const responseToMessage = (res: any): Partial<ChatMessage> => ({
  text: res?.text || '', thinking: res?.thinking, toolCalls: res?.toolCalls, diffSnapshots: res?.diffSnapshots,
  status: res?.status, model: res?.model, durationMs: res?.durationMs
});

export const sendChatMessage = async (text: string): Promise<void> => {
  const runStore = useAgentRunStore.getState();
  if (runStore.isBusy || !text.trim()) return;
  ensureAgentEventBridge();
  pipelineCancelled = false;

  const agent = useAgentStore.getState();
  agent.evaluateAndSetToolDecision(text);
  const conversationId = useConversationStore.getState().activeConversationId;
  const history = buildHistoryPayload(agent.chatMessages);
  const userMsg: ChatMessage = { id: newId('msg'), role: 'user', text, timestamp: Date.now() };
  await upsertMessage(conversationId, userMsg);
  runStore.setBusy(true);

  const handles = new Map<string, StreamHandle>();
  const beginRun = (agentRole: string) => {
    const handle = beginStreamingMessage(conversationId, agentRole);
    handles.set(handle.runId, handle);
    return handle.runId;
  };
  const commitWorkflow = async (messages: ChatMessage[], diffs: any[]) => {
    diffs.forEach((d) => agent.addAgentDiffSnapshot(d));
    for (const m of messages) {
      const handle = m.runId ? handles.get(m.runId) : undefined;
      if (handle) { handles.delete(handle.runId); await completeStreamingMessage(handle, { ...m, id: handle.messageId }); }
      else await upsertMessage(conversationId, m);
    }
  };

  try {
    const lead = buildLeadOptions(text, history);
    const engineSettings = agent.engineSettings;
    const shouldRunCombo = (agent.isComboFlowEnabled || detectComboTrigger(text)) && lead.activeCombo;

    if (lead.taggedSubagentId) {
      const res = await runTaggedSubagentWorkflow({
        wsPath: lead.wsPath, text, engineSettings, subagents: lead.subagents, taggedSubagentId: lead.taggedSubagentId,
        contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path, beginRun
      });
      await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
      return;
    }

    if (shouldRunCombo && lead.activeCombo) {
      const res = await runComboTeamWorkflow({
        wsPath: lead.wsPath, text, engineSettings, combo: lead.activeCombo, subagents: lead.subagents,
        contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path,
        activeFileContent: agent.activeFile?.content, beginRun,
        onMessageCommitted: async (msg) => { await upsertMessage(conversationId, msg); }
      });
      await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
      return;
    }

    if (detectDelegationTrigger(text)) {
      const res = await runLeadDelegationWorkflow({
        wsPath: lead.wsPath, text, engineSettings, subagents: lead.subagents,
        contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path,
        activeFileContent: agent.activeFile?.content, beginRun,
        onMessageCommitted: async (msg) => { await upsertMessage(conversationId, msg); }
      });
      await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
      return;
    }

    const extra = {
      activeSkills: lead.activeSkillsList, appliedRules: lead.appliedRulesList,
      classMismatchWarning: lead.classMismatchWarning?.warningText
    };
    const handle = beginStreamingMessage(conversationId, 'lead-architect', extra);
    const response = await sendPromptSafely(text, { ...lead.options, runId: handle.runId });
    response?.diffSnapshots?.forEach((snap: any) => agent.addAgentDiffSnapshot(snap));
    const leadMsg = await completeStreamingMessage(handle, { ...responseToMessage(response), ...extra });
    if (leadMsg.status !== 'completed' || pipelineCancelled) return;

    const review = await runPostCodeReviewWorkflow({
      wsPath: lead.wsPath, text, response, engineSettings, subagents: lead.subagents,
      contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path, beginRun
    });
    await commitWorkflow(review.messagesToAdd, review.diffsToAdd);
  } catch (error: any) {
    if (!(error instanceof PipelineCancelled)) agent.addToast(error?.message || 'Error communicating with AI engine', 'error');
  } finally {
    for (const h of handles.values()) await completeStreamingMessage(h, { status: pipelineCancelled ? 'cancelled' : 'failed' });
    useAgentRunStore.getState().setBusy(false);
  }
};

export const cancelActiveRun = async (): Promise<void> => {
  pipelineCancelled = true;
  const run = useAgentRunStore.getState().activeRun;
  if (run) await window.lamApi?.ai?.cancelRun?.(run.runId);
};