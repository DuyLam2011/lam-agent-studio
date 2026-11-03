import { generateRemediationForChat, generateLeadFinalConclusionForChat } from '../advisory/agentChatCollaborationService';
import { executeSupervisedSubagent } from '../subagents/subagentSupervisorEngine';
import { ChatMessage } from '../../store/useAgentStore';

export const makeAgentMsg = (agentRole: string, text: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id: Math.random().toString(36).substring(7),
  role: 'agent',
  agentRole: agentRole as any,
  agentId: agentRole,
  text,
  timestamp: Date.now(),
  ...extra
});

export type BeginRun = (agentRole: string) => string;

interface TaggedReviewOptions {
  wsPath: string;
  text: string;
  engineSettings: any;
  subagents: any[];
  taggedSubagentId: string;
  contextAttachments?: any[];
  activeFilePath?: string;
  beginRun?: BeginRun;
}

const remediationMessage = (res: any, fallbackText: string, runId?: string): ChatMessage =>
  makeAgentMsg('lead-architect', res.text || fallbackText, {
    runId, thinking: res.thinking, toolCalls: res.toolCalls,
    diffSnapshots: res.diffSnapshots, status: res.status, model: res.model, durationMs: res.durationMs
  });

export const runTaggedSubagentWorkflow = async (options: TaggedReviewOptions) => {
  const { wsPath, text, engineSettings, subagents, taggedSubagentId, contextAttachments, activeFilePath, beginRun } = options;
  const messagesToAdd: ChatMessage[] = [];
  const diffsToAdd: any[] = [];

  const reviewRole = taggedSubagentId || 'subagent-backend-reviewer';
  const reviewRunId = beginRun?.(reviewRole);
  const reviewRes = await executeSupervisedSubagent({
    workspacePath: wsPath, userGoal: text, engineSettings, subagents, targetSubagentId: taggedSubagentId,
    runId: reviewRunId, contextAttachments, activeFilePath
  }, (notice) => { messagesToAdd.push(makeAgentMsg('lead-architect', notice)); });

  messagesToAdd.push(makeAgentMsg(
    (reviewRes.subagentId as any) || 'subagent-backend-reviewer',
    `${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
    { thinking: reviewRes.thinking, runId: reviewRunId, status: reviewRes.status }
  ));

  if (reviewRes.status !== 'cancelled' && (reviewRes.hasActionableIssues || /sửa|fix|patch|remediate|apply/i.test(text))) {
    const fixRunId = beginRun?.('lead-architect');
    const followUpRes = await generateRemediationForChat(reviewRes.reviewText, {
      workspacePath: wsPath, engineSettings, contextAttachments, activeFilePath, userGoal: text, runId: fixRunId
    });
    if (followUpRes) {
      if (followUpRes.diffSnapshots) diffsToAdd.push(...followUpRes.diffSnapshots);
      messagesToAdd.push(remediationMessage(followUpRes, 'Đã phân tích review và áp dụng các chỉnh sửa cần thiết.', fixRunId));
    }
  } else if (reviewRes.status !== 'cancelled') {
    const leadRunId = beginRun?.('lead-architect');
    const conclusion = await generateLeadFinalConclusionForChat({
      subagentName: reviewRes.subagentName || reviewRole, reviewResult: reviewRes, diffSnapshots: diffsToAdd,
      userGoal: text, workspacePath: wsPath, engineSettings, contextAttachments, activeFilePath, runId: leadRunId
    });
    messagesToAdd.push(makeAgentMsg('lead-architect', conclusion.text, { runId: leadRunId, status: 'completed' }));
  }

  return { messagesToAdd, diffsToAdd };
};

interface PostCodeReviewOptions {
  wsPath: string;
  text: string;
  response: any;
  engineSettings: any;
  subagents: any[];
  contextAttachments?: any[];
  activeFilePath?: string;
  beginRun?: BeginRun;
}

export const runPostCodeReviewWorkflow = async (options: PostCodeReviewOptions) => {
  const { wsPath, text, response, engineSettings, subagents, contextAttachments, activeFilePath, beginRun } = options;
  const messagesToAdd: ChatMessage[] = [];
  const diffsToAdd: any[] = [];

  const hasCodeChanges = (response.diffSnapshots && response.diffSnapshots.length > 0) ||
    response.toolCalls?.some((tc: any) => ['write_file', 'edit_file', 'patch_file'].includes(tc.name) && tc.status !== 'failed');
  const hasReviewIntent = /audit|review|security|pentest|kiểm tra|rà soát|check/i.test(text);

  if (!hasCodeChanges && !hasReviewIntent) return { messagesToAdd, diffsToAdd };

  const reviewRunId = beginRun?.('subagent-backend-reviewer');
  const reviewRes = await executeSupervisedSubagent({
    workspacePath: wsPath, diffSnapshots: response.diffSnapshots, toolCalls: response.toolCalls,
    userGoal: text, engineSettings, subagents, runId: reviewRunId, contextAttachments, activeFilePath
  }, (notice) => { messagesToAdd.push(makeAgentMsg('lead-architect', notice)); });

  messagesToAdd.push(makeAgentMsg('subagent-backend-reviewer', `${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`, {
    thinking: reviewRes.thinking, runId: reviewRunId, status: reviewRes.status
  }));

  if (reviewRes.hasActionableIssues && reviewRes.status !== 'cancelled') {
    const fixRunId = beginRun?.('lead-architect');
    const followUpRes = await generateRemediationForChat(reviewRes.reviewText, {
      workspacePath: wsPath, engineSettings, contextAttachments, activeFilePath, runId: fixRunId
    });
    if (followUpRes) {
      if (followUpRes.diffSnapshots) diffsToAdd.push(...followUpRes.diffSnapshots);
      messagesToAdd.push(remediationMessage(followUpRes, 'Đã khắc phục theo review của backend specialist.', fixRunId));
    }
  } else if (reviewRes.status !== 'cancelled') {
    const leadRunId = beginRun?.('lead-architect');
    const conclusion = await generateLeadFinalConclusionForChat({
      subagentName: reviewRes.subagentName || 'subagent-backend-reviewer', reviewResult: reviewRes,
      diffSnapshots: response.diffSnapshots || [], userGoal: text, workspacePath: wsPath,
      engineSettings, contextAttachments, activeFilePath, runId: leadRunId
    });
    messagesToAdd.push(makeAgentMsg('lead-architect', conclusion.text, { runId: leadRunId, status: 'completed' }));
  }

  return { messagesToAdd, diffsToAdd };
};
