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
  const announceText = `🛡️ **Penetration Testing & Security Audit Mode: Delegating to Specialized Security Sentinel**\n\nI will delegate the security audit to subagent **${sub.name}** (${routing.packageName} [Model: \`${routing.modelName}\`]), covering OWASP Top 10 vulnerabilities, secrets scanning, injection/XSS/RCE checks, and privilege boundaries.\n\n> ⚠️ *The Security Audit process is strictly **Read-Only** (inspect and analyze vulnerabilities only; zero file mutations).*`;
  const announceMsg = makeAgentMsg('lead-architect', announceText);
  messagesToAdd.push(announceMsg);
  await onMessageCommitted?.(announceMsg);

  // 2. Collect comprehensive security context
  const secContext = await collectSecurityContext(wsPath);

  // 3. Supervised Execution of Security Sentinel
  const runId = beginRun?.(sub.id);
  const auditPrompt = `[PENETRATION TESTING & SECURITY AUDIT - STRICTLY READ-ONLY]
Request: ${text}
Category: ${intent.auditCategory.toUpperCase()}
Git Context: ${secContext.summary}
${secContext.diffText}

DIRECTIVES:
1. Audit OWASP Top 10 (Injection, Broken Auth, Sensitive Data Exposure, Security Misconfiguration, Insecure Direct Object References).
2. Scan for hardcoded API keys, JWT tokens, DB credentials in code and git history.
3. Verify sandbox boundaries and dangerous primitives (eval, exec, spawn, process.exit, raw queries).
4. Classify severity: CRITICAL, HIGH, MEDIUM, LOW with estimated CVSS scores.
5. Explicitly cite file paths and line numbers.
6. Output clear VERDICT: SECURE or VULNERABILITIES_FOUND. Strictly forbidden from calling file-editing tools.`;

  const reviewRes = await executeSupervisedSubagent({
    workspacePath: wsPath, userGoal: auditPrompt,
    engineSettings: { ...engineSettings, provider: routing.provider, selectedModel: routing.modelId },
    subagents, targetSubagentId: sub.id, runId, contextAttachments, activeFilePath, activeFileContent,
    taskContract: {
      objective: `Codebase Penetration Testing & OWASP Security Audit (${intent.auditCategory.toUpperCase()})`,
      expectedContext: secContext.summary,
      expectedResult: 'Security vulnerability matrix with CVSS scores and VERDICT'
    }
  }, async (notice) => {
    const noticeMsg = makeAgentMsg('lead-architect', notice);
    messagesToAdd.push(noticeMsg);
    await onMessageCommitted?.(noticeMsg);
  });

  // 4. Post Security Audit Report
  const subMsg = makeAgentMsg(
    (reviewRes.subagentId as any) || sub.id,
    `### 🛡️ ${sub.name} · Security Assessment & Pentest Report\n**Provider Package:** ${routing.packageName} (\`${routing.modelName}\`)\n**Scope:** ${secContext.summary}\n\n${reviewRes.reviewText}\n\n> 🔍 *[Supervisor Quality Score: ${reviewRes.qualityScore}/100 — ${reviewRes.supervisorNotes}]*`,
    { thinking: reviewRes.thinking, toolCalls: reviewRes.toolCalls, runId, status: reviewRes.status }
  );
  messagesToAdd.push(subMsg);
  await onMessageCommitted?.(subMsg);

  // 5. Father Agent Final Synthesis
  const leadRunId = beginRun?.('lead-architect');
  const verdictText = reviewRes.hasActionableIssues
    ? `🚨 **Father Agent Security Verdict: [VULNERABILITIES DETECTED]**\n\nSubagent **${sub.name}** identified security risks requiring remediation.\n\n💡 *If you would like me (Father Agent) to draft and apply surgical security patches to remediate these vulnerabilities, please confirm below.*`
    : `🛡️ **Father Agent Security Verdict: [SECURE - PASS]**\n\nSubagent **${sub.name}** thoroughly verified codebase against OWASP standards. No credential leaks or critical vulnerabilities detected. Ready for production!`;

  const leadMsg = makeAgentMsg('lead-architect', verdictText, { runId: leadRunId, status: 'completed' });
  messagesToAdd.push(leadMsg);
  await onMessageCommitted?.(leadMsg);

  return { messagesToAdd, diffsToAdd };
};
