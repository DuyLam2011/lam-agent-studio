import { SubagentPersona } from '../../types/subagents';
import { executeSupervisedSubagent } from '../subagents/subagentSupervisorEngine';
import { makeAgentMsg, BeginRun } from '../reviews/agentReviewOrchestrator';
import { ChatMessage } from '../../store/useAgentStore';
import { SecurityAuditIntent } from './agentSecurityAuditRouter';
import { resolveSubagentModel } from '../subagents/subagentModelRouter';

export interface DedicatedSecurityOptions {
  wsPath: string;
  text: string;
  engineSettings: any;
  subagents: SubagentPersona[];
  intent: SecurityAuditIntent;
  contextAttachments?: any[];
  activeFilePath?: string;
  activeFileContent?: string;
  beginRun?: BeginRun;
  onMessageCommitted?: (msg: ChatMessage) => Promise<void> | void;
}

const collectSecurityContext = async (wsPath: string): Promise<{ summary: string; diffText: string }> => {
  const git = typeof window !== 'undefined' ? (window as any).lamApi?.git : undefined;
  if (!git) return { summary: 'Môi trường workspace cục bộ (Read-Only)', diffText: '' };

  if (git.getComprehensiveReviewContext) {
    try {
      const res = await git.getComprehensiveReviewContext(wsPath);
      if (res?.success) return { summary: res.summary, diffText: res.diffText };
    } catch {}
  }

  return { summary: 'Working tree files & dependencies', diffText: '' };
};

export const runDedicatedSecurityWorkflow = async (options: DedicatedSecurityOptions) => {
  const { wsPath, text, engineSettings, subagents, intent, contextAttachments, activeFilePath, activeFileContent, beginRun, onMessageCommitted } = options;
  const messagesToAdd: ChatMessage[] = [];
  const diffsToAdd: any[] = [];

  const sub = subagents.find((s) => s.id === intent.recommendedSubagentId || s.id.includes(intent.recommendedSubagentId)) ||
    subagents.find((s) => s.id.includes('security') || s.name.toLowerCase().includes('security')) || subagents[0];
  const routing = resolveSubagentModel(sub, text, engineSettings);

  // 1. Father Agent announces Security & Penetration Testing Mode (Explicit Read-Only)
  const announceText = `🛡️ **Penetration Testing & Security Audit Mode: Phân quyền cho Subagent chuyên trách**\n\nTôi sẽ giao toàn bộ kiểm thử an ninh mã nguồn cho Subagent **${sub.name}** (${routing.packageName} [Model: \`${routing.modelName}\`]), bao gồm rà soát OWASP Top 10, quét rò rỉ secrets, kiểm tra SQLi/XSS/RCE và ranh giới quyền hạn.\n\n> ⚠️ *Quy trình Security Audit là **Read-Only** (chỉ phân tích lỗ hổng và đánh giá nguy cơ, không sửa file).*`;
  const announceMsg = makeAgentMsg('lead-architect', announceText);
  messagesToAdd.push(announceMsg);
  await onMessageCommitted?.(announceMsg);

  // 2. Collect comprehensive security context
  const secContext = await collectSecurityContext(wsPath);

  // 3. Supervised Execution of Security Sentinel
  const runId = beginRun?.(sub.id);
  const auditPrompt = `[PENETRATION TESTING & SECURITY AUDIT - STRICTLY READ-ONLY]
Yêu cầu kiểm thử: ${text}
Phân nhóm: ${intent.auditCategory.toUpperCase()}
Ngữ cảnh Git: ${secContext.summary}
${secContext.diffText}

NHIỆM VỤ CHUYÊN TRÁCH:
1. Rà soát OWASP Top 10 (Injection, Broken Auth, Sensitive Data Exposure, Security Misconfiguration, Insecure Direct Object References).
2. Quét secrets, hardcoded API keys, JWT tokens, DB passwords trong code và git history.
3. Kiểm tra ranh giới sandbox và các lệnh nguy hiểm (eval, exec, spawn, process.exit, raw queries).
4. Phân loại theo mức độ nghiêm trọng: CRITICAL, HIGH, MEDIUM, LOW kèm điểm CVSS ước tính.
5. Trích dẫn rõ ràng đường dẫn file và dòng code chứa lỗ hổng.
6. Đưa ra VERDICT: SECURE hoặc VULNERABILITIES_FOUND. Tuyệt đối không gọi tool sửa file.`;

  const reviewRes = await executeSupervisedSubagent({
    workspacePath: wsPath, userGoal: auditPrompt,
    engineSettings: { ...engineSettings, provider: routing.provider, selectedModel: routing.modelId },
    subagents, targetSubagentId: sub.id, runId, contextAttachments, activeFilePath, activeFileContent,
    taskContract: {
      objective: `Codebase Penetration Testing & OWASP Security Audit (${intent.auditCategory.toUpperCase()})`,
      expectedContext: secContext.summary,
      expectedResult: 'Ma trận lỗ hổng an ninh kèm CVSS và VERDICT'
    }
  }, async (notice) => {
    const noticeMsg = makeAgentMsg('lead-architect', notice);
    messagesToAdd.push(noticeMsg);
    await onMessageCommitted?.(noticeMsg);
  });

  // 4. Post Security Audit Report
  const subMsg = makeAgentMsg(
    (reviewRes.subagentId as any) || sub.id,
    `### 🛡️ ${sub.name} · Báo Cáo Thẩm Định An Ninh & Pentest\n**Gói Kết Nối:** ${routing.packageName} (\`${routing.modelName}\`)\n**Phạm Vi:** ${secContext.summary}\n\n${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
    { thinking: reviewRes.thinking, toolCalls: reviewRes.toolCalls, runId, status: reviewRes.status }
  );
  messagesToAdd.push(subMsg);
  await onMessageCommitted?.(subMsg);

  // 5. Father Agent Final Synthesis
  const leadRunId = beginRun?.('lead-architect');
  const verdictText = reviewRes.hasActionableIssues
    ? `🚨 **Tổng Hợp An Ninh Từ Father Agent: [PHÁT HIỆN LỖ HỔNG NGUY HIỂM]**\n\nSubagent **${sub.name}** đã hoàn tất rà soát và phát hiện các rủi ro bảo mật cần vá khẩn cấp.\n\n💡 *Nếu bạn muốn tôi (Father Agent) tiến hành tạo bản vá bảo mật tự động (surgical security patches) để khắc phục các lỗ hổng trên, hãy phản hồi xác nhận bên dưới.*`
    : `🛡️ **Tổng Hợp An Ninh Từ Father Agent: [SECURE - PASS]**\n\nSubagent **${sub.name}** đã kiểm tra toàn diện và xác nhận hệ thống đạt chuẩn an toàn OWASP, không phát hiện rò rỉ secrets hay lỗ hổng nghiêm trọng. Sẵn sàng vận hành!`;

  const leadMsg = makeAgentMsg('lead-architect', verdictText, { runId: leadRunId, status: 'completed' });
  messagesToAdd.push(leadMsg);
  await onMessageCommitted?.(leadMsg);

  return { messagesToAdd, diffsToAdd };
};
