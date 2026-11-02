import { DistilledFinding, FindingSeverity } from './subagentResultDistiller';

export const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1
};

export const deduplicateFindings = (findings: DistilledFinding[]): DistilledFinding[] => {
  const map = new Map<string, DistilledFinding>();

  for (const f of findings) {
    const key = `${f.fileCitation.toLowerCase()}::${f.lineRange || 'any'}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...f });
    } else {
      if (!existing.subagentName.includes(f.subagentName)) {
        existing.subagentName = `${existing.subagentName} + ${f.subagentName}`;
      }
      if (SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[existing.severity]) {
        existing.severity = f.severity;
      }
      if (f.issueSummary && !existing.issueSummary.includes(f.issueSummary.slice(0, 30))) {
        existing.issueSummary = `${existing.issueSummary}; ${f.issueSummary}`;
      }
      if (f.suggestedPatchSnippet && !existing.suggestedPatchSnippet) {
        existing.suggestedPatchSnippet = f.suggestedPatchSnippet;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);
};

export const buildConsensusMatrixTable = (findings: DistilledFinding[]): string => {
  if (findings.length === 0) {
    return '| Status | Scope | Verdict |\n| :--- | :--- | :--- |\n| 🟢 CLEAN | Whole Workspace | 100% Passed specialist quality gates. Zero anomalies detected. |';
  }

  const rows = findings.map((f) => {
    const sevBadge = f.severity === 'CRITICAL' ? '🚨 CRITICAL'
      : f.severity === 'HIGH' ? '🔴 HIGH'
      : f.severity === 'MEDIUM' ? '⚠️ MEDIUM'
      : f.severity === 'LOW' ? '🟡 LOW' : 'ℹ️ INFO';
    const loc = f.lineRange ? `\`${f.fileCitation}:${f.lineRange}\`` : `\`${f.fileCitation}\``;
    return `| ${sevBadge} | ${loc} | **${f.subagentName}** | ${f.issueSummary} |`;
  });

  return [
    `| Priority | Target Scope & Citation | Reporter(s) | Anomaly & Prescribed Action |`,
    `| :--- | :--- | :--- | :--- |`,
    ...rows
  ].join('\n');
};

export const generateOptimizedLeadDirective = (params: {
  userGoal: string;
  findings: DistilledFinding[];
  allReviewsText?: string;
}): string => {
  const { userGoal, findings } = params;
  const deduped = deduplicateFindings(findings);
  const matrix = buildConsensusMatrixTable(deduped);

  if (deduped.length === 0) {
    return [
      `User Goal: "${userGoal}"`,
      `### 🛡️ Subagent Consensus Evaluation Matrix:`,
      matrix,
      `### 📋 Directive for Father Agent:`,
      `All subagent specialists verified the workspace as clean with zero critical anomalies. Synthesize an authoritative summary confirming readiness.`
    ].join('\n\n');
  }

  return [
    `User Goal: "${userGoal}"`,
    `### 🎯 High-Density Subagent Consensus Matrix (Deduplicated & Prioritized):`,
    matrix,
    `### 🛠️ Priority Remediation Directives for Father Agent:`,
    `- Apply surgical patches ('edit_file' or 'write_file') resolving the prioritized targets above from top to bottom.`,
    `- Ensure all modified files strictly comply with Rule 4 (< 150 lines/file) and 100% strict TypeScript.`,
    `- Verify zero regressions upon applying patches.`
  ].join('\n\n');
};

export const estimateDistillationTokenSavings = (rawText: string, distilledText: string) => {
  const rawTokens = Math.max(1, Math.ceil((rawText || '').length / 3.8));
  const distilledTokens = Math.max(1, Math.ceil((distilledText || '').length / 3.8));
  const savingsPercent = Math.max(0, Math.round(((rawTokens - distilledTokens) / rawTokens) * 100));
  return { rawTokens, distilledTokens, savingsPercent };
};
