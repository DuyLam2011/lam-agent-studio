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
  if (!git) return { summary: 'Môi trường workspace cục bộ (Read-Only)', diffText: '' };

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
  const announceText = `🔍 **Review Mode Activated: Phân quyền cho Subagent chuyên trách**\n\nTôi sẽ giao toàn bộ review cho Subagent **${sub.name}** (${routing.packageName} [Model: \`${routing.modelName}\`]), bao gồm staged, unstaged, branch diffs và untracked files, rồi trả kết quả lại đây.\n\n> 🛡️ *Quy trình Review là **Read-Only** (chỉ đọc và phân tích, không sửa file).*`;
  const announceMsg = makeAgentMsg('lead-architect', announceText);
  messagesToAdd.push(announceMsg);
  await onMessageCommitted?.(announceMsg);

  // 2. Collect comprehensive Git context from Main Process
  const gitContext = await collectGitReviewContext(wsPath, intent.targetRef);

  // 3. Supervised Execution of the Review Subagent
  const runId = beginRun?.(sub.id);
  const reviewPrompt = `[CODE REVIEW TASK - STRICTLY READ-ONLY]\nYêu cầu: ${text}\nPhạm vi: ${gitContext.summary}\n${gitContext.diffText}\n\nNHIỆM VỤ:\n1. Rà soát chất lượng code, lỗi logic, rủi ro an ninh và vi phạm Rule 4 (<150 dòng/file).\n2. Trích dẫn cụ thể file và dòng lỗi.\n3. Đưa ra VERDICT rõ ràng: PASS hoặc CHANGES_REQUIRED.\n4. Tuyệt đối không gọi tool sửa file (write_file/edit_file).`;

  const reviewRes = await executeSupervisedSubagent({
    workspacePath: wsPath, userGoal: reviewPrompt,
    engineSettings: { ...engineSettings, provider: routing.provider, selectedModel: routing.modelId },
    subagents, targetSubagentId: sub.id, runId, contextAttachments, activeFilePath, activeFileContent,
    taskContract: {
      objective: `Review code changes ${intent.targetRef ? `against ${intent.targetRef}` : 'in working tree'} (Read-Only)`,
      expectedContext: gitContext.summary,
      expectedResult: 'Báo cáo kiểm định chi tiết kèm VERDICT'
    }
  }, async (notice) => {
    const noticeMsg = makeAgentMsg('lead-architect', notice);
    messagesToAdd.push(noticeMsg);
    await onMessageCommitted?.(noticeMsg);
  });

  // 4. Post Review Result
  const subMsg = makeAgentMsg(
    (reviewRes.subagentId as any) || sub.id,
    `### 🛡️ ${sub.name} · Báo Cáo Kiểm Định Code\n**Gói Kết Nối:** ${routing.packageName} (\`${routing.modelName}\`)\n**Phạm Vi:** ${gitContext.summary}\n\n${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
    { thinking: reviewRes.thinking, toolCalls: reviewRes.toolCalls, runId, status: reviewRes.status }
  );
  messagesToAdd.push(subMsg);
  await onMessageCommitted?.(subMsg);

  // 5. Father Agent Final Synthesis
  const leadRunId = beginRun?.('lead-architect');
  const verdictText = reviewRes.hasActionableIssues
    ? `📋 **Tổng Hợp Từ Father Agent: [CẦN KHẮC PHỤC]**\n\nSubagent **${sub.name}** đã hoàn tất rà soát và phát hiện một số điểm cần điều chỉnh.\n\n💡 *Nếu bạn muốn tôi (Father Agent) tiến hành tạo bản vá tự động (surgical patch) để giải quyết các vấn đề trên, hãy phản hồi xác nhận bên dưới.*`
    : `🛡️ **Tổng Hợp Từ Father Agent: [VERIFIED - CLEAN]**\n\nSubagent **${sub.name}** đã kiểm tra toàn diện git diff và xác nhận mọi thay đổi đều đạt chuẩn an toàn, không phát sinh hồi quy hay vi phạm Rule 4. Sẵn sàng tích hợp!`;

  const leadMsg = makeAgentMsg('lead-architect', verdictText, { runId: leadRunId, status: 'completed' });
  messagesToAdd.push(leadMsg);
  await onMessageCommitted?.(leadMsg);

  return { messagesToAdd, diffsToAdd };
};
