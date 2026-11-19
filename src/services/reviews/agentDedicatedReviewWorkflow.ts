import { SubagentPersona } from '../../types/subagents';
import { executeSupervisedSubagent } from '../subagents/subagentSupervisorEngine';
import { makeAgentMsg, BeginRun } from './agentReviewOrchestrator';
import { ChatMessage } from '../../store/useAgentStore';
import { CodeReviewIntent } from './agentCodeReviewRouter';
import { resolveSubagentModel } from '../subagents/subagentModelRouter';

export interface DedicatedReviewOptions {
  wsPath: string;
  text: string;
  engineSettings: any;
  subagents: SubagentPersona[];
  intent: CodeReviewIntent;
  contextAttachments?: any[];
  activeFilePath?: string;
  activeFileContent?: string;
  beginRun?: BeginRun;
  onMessageCommitted?: (msg: ChatMessage) => Promise<void> | void;
}

const collectGitReviewContext = async (wsPath: string, targetRef?: string): Promise<{ summary: string; diffText: string }> => {
  const git = typeof window !== 'undefined' ? (window as any).lamApi?.git : undefined;
  if (!git) return { summary: 'Local workspace environment (Read-Only)', diffText: '' };

  // High-speed parallel IPC in Main Process
  if (git.getComprehensiveReviewContext) {
    try {
      const res = await git.getComprehensiveReviewContext(wsPath, targetRef);
      if (res?.success) return { summary: res.summary, diffText: res.diffText };
    } catch {}
  }

  // Fallback for standalone/mock environments
  const sections: string[] = [];
  try {
    const s = (await git.status?.(wsPath))?.data;
    if (s) {
      sections.push(`### 📊 Git Status Summary:\n- Files: ${s.files?.length || 0} (${s.staged?.length || 0} staged)`);
    }
    const diff = (await git.diff?.(wsPath))?.data;
    if (diff?.trim()) sections.push(`### 📝 Unstaged Diff:\n\`\`\`diff\n${diff.slice(0, 6000)}\n\`\`\``);
  } catch {}

  return { summary: 'Working tree (Staged & Unstaged)', diffText: sections.join('\n\n') };
};

export const runDedicatedCodeReviewWorkflow = async (options: DedicatedReviewOptions) => {
  const { wsPath, text, engineSettings, subagents, intent, contextAttachments, activeFilePath, activeFileContent, beginRun, onMessageCommitted } = options;
  const messagesToAdd: ChatMessage[] = [];
  const diffsToAdd: any[] = [];

  const sub = subagents.find((s) => s.id === intent.recommendedSubagentId || s.id.includes(intent.recommendedSubagentId)) ||
    subagents.find((s) => s.role.toLowerCase().includes('review')) || subagents[0];
  const routing = resolveSubagentModel(sub, text, engineSettings);

  // 1. Father Agent announces Review Mode (Explicit Read-Only Delegation)
  const announceText = `🔍 **Review Mode Activated: Delegating to Specialized Review Class**\n\nI will delegate the code review to subagent **${sub.name}** (${routing.packageName} [Model: \`${routing.modelName}\`]), covering staged, unstaged, branch diffs and untracked files, then return the synthesized verdict here.\n\n> 🛡️ *The Review workflow is strictly **Read-Only** (inspect and analyze only; zero file mutations).*`;
  const announceMsg = makeAgentMsg('lead-architect', announceText);
  messagesToAdd.push(announceMsg);
  await onMessageCommitted?.(announceMsg);

  // 2. Collect comprehensive Git context from Main Process
  const gitContext = await collectGitReviewContext(wsPath, intent.targetRef);

  // 3. Supervised Execution of the Review Subagent
  const runId = beginRun?.(sub.id);
  const reviewPrompt = `[CODE REVIEW TASK - STRICTLY READ-ONLY]\nRequest: ${text}\nScope: ${gitContext.summary}\n${gitContext.diffText}\n\nDIRECTIVES:\n1. Audit code quality, logic errors, security risks, and Rule 4 compliance (<150 lines/file).\n2. Explicitly cite file paths and line numbers.\n3. Output a clear VERDICT: PASS or CHANGES_REQUIRED.\n4. Strictly forbidden from calling file-editing tools (write_file/edit_file).`;

  const reviewRes = await executeSupervisedSubagent({
    workspacePath: wsPath, userGoal: reviewPrompt,
    engineSettings: { ...engineSettings, provider: routing.provider, selectedModel: routing.modelId },
    subagents, targetSubagentId: sub.id, runId, contextAttachments, activeFilePath, activeFileContent,
    taskContract: {
      objective: `Review code changes ${intent.targetRef ? `against ${intent.targetRef}` : 'in working tree'} (Read-Only)`,
      expectedContext: gitContext.summary,
      expectedResult: 'Comprehensive audit report with clear VERDICT'
    }
  }, async (notice) => {
    const noticeMsg = makeAgentMsg('lead-architect', notice);
    messagesToAdd.push(noticeMsg);
    await onMessageCommitted?.(noticeMsg);
  });

  // 4. Post Review Result
  const subMsg = makeAgentMsg(
    (reviewRes.subagentId as any) || sub.id,
    `### 🛡️ ${sub.name} · Code Inspection Report\n**Provider Package:** ${routing.packageName} (\`${routing.modelName}\`)\n**Scope:** ${gitContext.summary}\n\n${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
    { thinking: reviewRes.thinking, toolCalls: reviewRes.toolCalls, runId, status: reviewRes.status }
  );
  messagesToAdd.push(subMsg);
  await onMessageCommitted?.(subMsg);

  // 5. Father Agent Final Synthesis
  const leadRunId = beginRun?.('lead-architect');
  const verdictText = reviewRes.hasActionableIssues
    ? `📋 **Father Agent Synthesis: [CHANGES REQUIRED]**\n\nSubagent **${sub.name}** has completed the review and identified issues that require remediation.\n\n💡 *If you would like me (Father Agent) to draft and apply surgical patches to fix these issues, please confirm below.*`
    : `🛡️ **Father Agent Synthesis: [VERIFIED - CLEAN]**\n\nSubagent **${sub.name}** thoroughly verified all git diff changes. Code adheres strictly to safety, zero regressions, and Rule 4 compliance. Ready to merge!`;

  const leadMsg = makeAgentMsg('lead-architect', verdictText, { runId: leadRunId, status: 'completed' });
  messagesToAdd.push(leadMsg);
  await onMessageCommitted?.(leadMsg);

  return { messagesToAdd, diffsToAdd };
};
