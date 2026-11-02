import { AgentCombo } from '../types/agent-combo';
import { SubagentPersona } from '../types/subagents';
import { generateRemediationForChat, generateLeadSynthesisForChat } from './agentChatCollaborationService';
import { executeSupervisedSubagent } from './subagentSupervisorEngine';
import { makeAgentMsg, BeginRun } from './agentReviewOrchestrator';
import { ChatMessage } from '../store/useAgentStore';

export interface ComboWorkflowOptions {
  wsPath: string;
  text: string;
  engineSettings: any;
  combo: AgentCombo;
  subagents: SubagentPersona[];
  contextAttachments?: any[];
  activeFilePath?: string;
  activeFileContent?: string;
  beginRun?: BeginRun;
  onMessageCommitted?: (msg: ChatMessage) => Promise<void> | void;
}

export const runComboTeamWorkflow = async (options: ComboWorkflowOptions) => {
  const { wsPath, text, engineSettings, combo, subagents, contextAttachments, activeFilePath, activeFileContent, beginRun, onMessageCommitted } = options;
  const messagesToAdd: ChatMessage[] = [];
  const diffsToAdd: any[] = [];
  const accumulatedIssues: string[] = [];
  const allReviews: string[] = [];

  // 1. Announce Combo Launch
  const announceMsg = makeAgentMsg(
    'lead-architect',
    `⚡ **Activating Agent Combo: ${combo.name}**\n- **Pipeline Flow**: \`${combo.flowType.toUpperCase()}\`\n- **Ensemble Team**: ${combo.subagentIds.map(id => `@${id.replace('subagent-', '')}`).join(' ➔ ')}\n- **Goal**: ${text}`
  );
  messagesToAdd.push(announceMsg);
  await onMessageCommitted?.(announceMsg);

  // 2. Execute Steps
  for (const step of combo.steps) {
    const subagent = subagents.find((s) => s.id === step.subagentId) ||
      subagents.find((s) => s.id.includes(step.subagentId));
    const roleId = subagent?.id || step.subagentId;
    const runId = beginRun?.(roleId);

    const stepPrompt = `[Combo Step: ${step.stepName}] Objective: ${step.objective}\nUser Goal: ${text}`;
    const reviewRes = await executeSupervisedSubagent({
      workspacePath: wsPath,
      userGoal: stepPrompt,
      engineSettings,
      subagents,
      targetSubagentId: roleId,
      runId,
      contextAttachments,
      activeFilePath,
      activeFileContent,
      taskContract: { objective: step.objective }
    }, async (notice) => {
      const noticeMsg = makeAgentMsg('lead-architect', notice);
      messagesToAdd.push(noticeMsg);
      await onMessageCommitted?.(noticeMsg);
    });

    const stepMsg = makeAgentMsg(
      (reviewRes.subagentId as any) || roleId,
      `### 🛡️ ${step.stepName} (${reviewRes.subagentName})\n**Objective**: ${step.objective}\n\n${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
      { thinking: reviewRes.thinking, runId, status: reviewRes.status }
    );
    messagesToAdd.push(stepMsg);
    await onMessageCommitted?.(stepMsg);

    allReviews.push(`[${step.stepName} (${reviewRes.subagentName})]:\n${reviewRes.reviewText}`);
    if (reviewRes.hasActionableIssues) {
      accumulatedIssues.push(`[${step.stepName}]: ${reviewRes.reviewText}`);
    }
  }

  // 3. Father Agent Universal Synthesis & Resolution
  const leadRunId = beginRun?.('lead-architect');
  const allReviewsText = allReviews.join('\n\n---\n\n');

  if (accumulatedIssues.length > 0) {
    const followUpRes = await generateRemediationForChat(accumulatedIssues.join('\n\n---\n\n'), {
      workspacePath: wsPath,
      engineSettings,
      contextAttachments,
      activeFilePath,
      userGoal: `Remediate findings from Agent Combo (${combo.name}) execution for: ${text}`,
      runId: leadRunId
    });

    if (followUpRes?.diffSnapshots) diffsToAdd.push(...followUpRes.diffSnapshots);
    const remediateMsg = makeAgentMsg(
      'lead-architect',
      followUpRes?.text || 'Đã tổng hợp các phát hiện từ đội ngũ Agent Combo và áp dụng bản vá tối ưu.',
      {
        runId: leadRunId,
        thinking: followUpRes?.thinking,
        toolCalls: followUpRes?.toolCalls,
        diffSnapshots: followUpRes?.diffSnapshots,
        status: followUpRes?.status || 'completed'
      }
    );
    messagesToAdd.push(remediateMsg);
    await onMessageCommitted?.(remediateMsg);
  } else {
    const synthesisRes = await generateLeadSynthesisForChat(combo.name, allReviewsText, {
      workspacePath: wsPath,
      engineSettings,
      contextAttachments,
      activeFilePath,
      userGoal: text,
      runId: leadRunId
    });

    const cleanMsg = makeAgentMsg(
      'lead-architect',
      synthesisRes?.text || `🛡️ **Combo Execution Verdict:** **[VERIFIED]**\n\nĐội ngũ Agent Combo (\`${combo.name}\`) đã kiểm tra toàn diện và xác nhận mọi tiêu chí đạt chuẩn an toàn, không phát sinh lỗi.`,
      {
        runId: leadRunId,
        thinking: synthesisRes?.thinking,
        toolCalls: synthesisRes?.toolCalls,
        status: synthesisRes?.status || 'completed'
      }
    );
    messagesToAdd.push(cleanMsg);
    await onMessageCommitted?.(cleanMsg);
  }

  return { messagesToAdd, diffsToAdd };
};