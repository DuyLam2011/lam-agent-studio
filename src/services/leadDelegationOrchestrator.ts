import { SubagentPersona } from '../types/subagents';
import { generateRemediationForChat, generateLeadSynthesisForChat } from './agentChatCollaborationService';
import { executeSupervisedSubagent } from './subagentSupervisorEngine';
import { makeAgentMsg, BeginRun } from './agentReviewOrchestrator';
import { ChatMessage } from '../store/useAgentStore';
import { detectDelegationTrigger, decomposeTaskWithRuleset, SubagentTaskContract, LeadDelegationPlan } from './leadDelegationPlanner';
import { parseSubagentFindings, DistilledFinding } from './subagentResultDistiller';
import { generateOptimizedLeadDirective, estimateDistillationTokenSavings } from './subagentSynthesisMatrix';

export { detectDelegationTrigger, decomposeTaskWithRuleset };
export type { SubagentTaskContract, LeadDelegationPlan };

export const runLeadDelegationWorkflow = async (options: {
  wsPath: string; text: string; engineSettings: any; subagents: SubagentPersona[];
  contextAttachments?: any[]; activeFilePath?: string; activeFileContent?: string;
  beginRun?: BeginRun; onMessageCommitted?: (msg: ChatMessage) => Promise<void> | void;
}) => {
  const { wsPath, text, engineSettings, subagents, contextAttachments, activeFilePath, activeFileContent, beginRun, onMessageCommitted } = options;
  const plan = decomposeTaskWithRuleset(text, subagents, engineSettings);
  const messagesToAdd: ChatMessage[] = [];
  const diffsToAdd: any[] = [];
  const allReviews: string[] = [];
  const allFindings: DistilledFinding[] = [];
  let hasAnyIssues = false;

  let planTable = `🎯 **Lead Agent Task Delegation & Model Routing Plan**\n\n`;
  planTable += `| Subagent | Auto-Routed Model & Tier | Context Yêu Cầu | Kết Quả Mong Muốn |\n| :--- | :--- | :--- | :--- |\n`;
  for (const c of plan.contracts) {
    planTable += `| **${c.subagentName}** | \`${c.routing.modelName}\` (${c.routing.tier.toUpperCase()}) | ${c.expectedContext} | ${c.expectedResult} |\n`;
  }
  const announceMsg = makeAgentMsg('lead-architect', `${planTable}\n> *Tự động phân tách context theo chuyên môn và kích hoạt subagent qua 4-Step Analysis Framework...*`);
  messagesToAdd.push(announceMsg);
  await onMessageCommitted?.(announceMsg);

  for (const c of plan.contracts) {
    const runId = beginRun?.(c.subagentId);
    const subPrompt = `[Task Contract: ${c.taskObjective}]\nExpected Context: ${c.expectedContext}\nExpected Result: ${c.expectedResult}\nUser Goal: ${plan.userGoal}`;
    const reviewRes = await executeSupervisedSubagent({
      workspacePath: wsPath, userGoal: subPrompt, engineSettings, subagents,
      targetSubagentId: c.subagentId, runId, contextAttachments, activeFilePath, activeFileContent,
      taskContract: { objective: c.taskObjective, expectedContext: c.expectedContext, expectedResult: c.expectedResult }
    }, async (notice) => {
      const noticeMsg = makeAgentMsg('lead-architect', notice);
      messagesToAdd.push(noticeMsg);
      await onMessageCommitted?.(noticeMsg);
    });

    const findings = parseSubagentFindings(c.subagentId, c.subagentName, reviewRes.reviewText);
    allFindings.push(...findings);
    if (reviewRes.hasActionableIssues || findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
      hasAnyIssues = true;
    }

    const subMsg = makeAgentMsg(
      (reviewRes.subagentId as any) || c.subagentId,
      `### 🛡️ ${c.subagentName} [Model: ${c.routing.modelName}]\n**Mục Tiêu:** ${c.taskObjective}\n**Context:** ${c.expectedContext}\n\n${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
      { thinking: reviewRes.thinking, runId, status: reviewRes.status }
    );
    messagesToAdd.push(subMsg);
    await onMessageCommitted?.(subMsg);
    allReviews.push(`[${c.subagentName}]:\n${reviewRes.reviewText}`);
  }

  const rawReviewsCombined = allReviews.join('\n\n---\n\n');
  const optimizedDirective = generateOptimizedLeadDirective({
    userGoal: plan.userGoal,
    findings: allFindings,
    allReviewsText: rawReviewsCombined
  });
  const savings = estimateDistillationTokenSavings(rawReviewsCombined, optimizedDirective);
  const leadRunId = beginRun?.('lead-architect');

  if (hasAnyIssues) {
    const followUpRes = await generateRemediationForChat(optimizedDirective, {
      workspacePath: wsPath, engineSettings, contextAttachments, activeFilePath,
      userGoal: `Synthesize and patch findings from Subagent Delegation: ${plan.userGoal}`, runId: leadRunId
    });
    if (followUpRes?.diffSnapshots) diffsToAdd.push(...followUpRes.diffSnapshots);
    const remediateMsg = makeAgentMsg('lead-architect', `${followUpRes?.text || 'Đã áp dụng bản vá hoàn chỉnh.'}\n\n> ⚡ *[Subagent Context Distillation: -${savings.savingsPercent}% tokens saved (${savings.rawTokens} → ${savings.distilledTokens} tokens) | ${allFindings.length} findings triaged]*`, {
      runId: leadRunId, thinking: followUpRes?.thinking, toolCalls: followUpRes?.toolCalls, diffSnapshots: followUpRes?.diffSnapshots, status: followUpRes?.status || 'completed'
    });
    messagesToAdd.push(remediateMsg);
    await onMessageCommitted?.(remediateMsg);
  } else {
    const synthRes = await generateLeadSynthesisForChat('Delegation Team', optimizedDirective, {
      workspacePath: wsPath, engineSettings, contextAttachments, activeFilePath, userGoal: plan.userGoal, runId: leadRunId
    });
    const cleanMsg = makeAgentMsg('lead-architect', `${synthRes?.text || 'Tất cả subagents đã hoàn thành nhiệm vụ.'}\n\n> ⚡ *[Subagent Context Distillation: -${savings.savingsPercent}% tokens saved (${savings.rawTokens} → ${savings.distilledTokens} tokens) | All Clear]*`, {
      runId: leadRunId, thinking: synthRes?.thinking, status: synthRes?.status || 'completed'
    });
    messagesToAdd.push(cleanMsg);
    await onMessageCommitted?.(cleanMsg);
  }

  return { messagesToAdd, diffsToAdd };
};
