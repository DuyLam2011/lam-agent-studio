import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { useAgentRunStore } from '../../store/useAgentRunStore';
import { runPostCodeReviewWorkflow, runTaggedSubagentWorkflow } from '../reviews/agentReviewOrchestrator';
import { detectComboTrigger } from '../combos/agentComboOrchestrator';
import { runComboTeamWorkflow } from '../combos/agentComboRunner';
import { detectDelegationTrigger, runLeadDelegationWorkflow } from '../lead-agent/leadDelegationOrchestrator';
import { detectCodeReviewIntent } from '../reviews/agentCodeReviewRouter';
import { runDedicatedCodeReviewWorkflow } from '../reviews/agentDedicatedReviewWorkflow';
import { detectSecurityAuditIntent } from '../security/agentSecurityAuditRouter';
import { runDedicatedSecurityWorkflow } from '../security/agentDedicatedSecurityWorkflow';
import { dispatchBuiltinCommand } from '../commands/agentCommandDispatcher';
import { checkAndDispatchClarification } from '../clarification/clarificationDispatcher';
import { runProviderLinkWorkflow } from '../provider-link/providerLinkChatRunner';
import { buildViewForRole } from './contextFilterService';
import { resolveAgentClassForTask } from '../agent-classes/agentClassRouter';
import { ensureAgentEventBridge } from './agentEventBridge';
import { buildLeadOptions, sendPromptSafely } from './leadOptionsBuilder';
import {
  StreamHandle, newId, upsertMessage, beginStreamingMessage,
  completeStreamingMessage, responseToMessage
} from './agentRunStreamer';

class PipelineCancelled extends Error {}
let pipelineCancelled = false;

export const sendChatMessage = async (text: string): Promise<void> => {
  const runStore = useAgentRunStore.getState();
  if (runStore.isBusy || !text.trim()) return;
  ensureAgentEventBridge();
  pipelineCancelled = false;

  const agent = useAgentStore.getState();
  agent.evaluateAndSetToolDecision(text);
  const conversationId = useConversationStore.getState().activeConversationId;
  const targetClass = resolveAgentClassForTask(text);
  const history = buildViewForRole(targetClass, agent.chatMessages, {
    activeFilePath: agent.activeFile?.path, activeFileContent: agent.activeFile?.content
  }).history;
  await upsertMessage(conversationId, { id: newId('msg'), role: 'user', text, timestamp: Date.now() });
  runStore.setBusy(true);

  const handles = new Map<string, StreamHandle>();
  const beginRun = (agentRole: string) => {
    if (pipelineCancelled) throw new PipelineCancelled();
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

    // 0. Built-in Command Dispatcher & Proactive Clarification Gate
    const cmd = await dispatchBuiltinCommand(text, (msg) => upsertMessage(conversationId, msg));
    if (cmd.handledLocally) return;
    if (await checkAndDispatchClarification(text, { activeFilePath: agent.activeFile?.path, history: agent.chatMessages, conversationId }, cmd.workflowType)) return;

    // 1. Dedicated Security & Penetration Testing Workflow
    const secIntent = detectSecurityAuditIntent(text, lead.subagents, lead.taggedSubagentId);
    if (cmd.workflowType === 'pentest' || secIntent.isSecurityAudit) {
      const res = await runDedicatedSecurityWorkflow({ wsPath: lead.wsPath, text, engineSettings, subagents: lead.subagents, intent: secIntent, contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path, activeFileContent: agent.activeFile?.content, beginRun, onMessageCommitted: (msg) => upsertMessage(conversationId, msg) });
      return await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
    }

    // 2. Dedicated Code Review Workflow
    const reviewIntent = detectCodeReviewIntent(text, lead.subagents, lead.taggedSubagentId);
    if (cmd.workflowType === 'review' || reviewIntent.isReview) {
      const res = await runDedicatedCodeReviewWorkflow({ wsPath: lead.wsPath, text, engineSettings, subagents: lead.subagents, intent: reviewIntent, contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path, activeFileContent: agent.activeFile?.content, beginRun, onMessageCommitted: (msg) => upsertMessage(conversationId, msg) });
      return await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
    }

    // 3. Explicit Tagged Subagent Workflow
    if (lead.taggedSubagentId) {
      const res = await runTaggedSubagentWorkflow({
        wsPath: lead.wsPath, text, engineSettings, subagents: lead.subagents, taggedSubagentId: lead.taggedSubagentId,
        contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path, beginRun
      });
      return await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
    }

    // 3.5. Provider Link Cross-AI Pipeline
    if (agent.providerLinkConfig?.enabled) {
      const res = await runProviderLinkWorkflow({ text, config: agent.providerLinkConfig, beginRun });
      return await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
    }

    // 4. Agent Combo Flow
    if (shouldRunCombo && lead.activeCombo) {
      const res = await runComboTeamWorkflow({
        wsPath: lead.wsPath, text, engineSettings, combo: lead.activeCombo, subagents: lead.subagents,
        contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path,
        activeFileContent: agent.activeFile?.content, beginRun,
        onMessageCommitted: (msg) => upsertMessage(conversationId, msg)
      });
      return await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
    }

    // 5. Lead Agent Task Delegation
    const shouldDelegate = (lead.subagents?.length || 0) > 0 && (
      detectDelegationTrigger(text) || ['deep', 'max_swarm'].includes(engineSettings?.hardworkLevel || '') || engineSettings?.reasoningEffort === 'high'
    );
    if (shouldDelegate) {
      const res = await runLeadDelegationWorkflow({
        wsPath: lead.wsPath, text, engineSettings, subagents: lead.subagents,
        contextAttachments: agent.contextAttachments, activeFilePath: agent.activeFile?.path,
        activeFileContent: agent.activeFile?.content, beginRun,
        onMessageCommitted: (msg) => upsertMessage(conversationId, msg)
      });
      return await commitWorkflow(res.messagesToAdd, res.diffsToAdd);
    }

    // 6. Standard Father Agent Pipeline
    const extra = { activeSkills: lead.activeSkillsList, appliedRules: lead.appliedRulesList, classMismatchWarning: lead.classMismatchWarning?.warningText };
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
};
