export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface DistilledFinding {
  id: string;
  subagentId: string;
  subagentName: string;
  severity: FindingSeverity;
  fileCitation: string;
  lineRange?: string;
  issueSummary: string;
  suggestedPatchSnippet?: string;
}

export const classifyFindingSeverity = (text: string): FindingSeverity => {
  const lower = text.toLowerCase();
  if (/critical|vulnerab|exploit|secret|leak|sqli|xss|rce|injection|zero-day/i.test(lower)) return 'CRITICAL';
  if (/high|security|auth|unauthorized|corruption|crash|data loss|forbidden/i.test(lower)) return 'HIGH';
  if (/medium|warning|rule 4|>150 lines|modularity|wcag|contrast|unhandled/i.test(lower)) return 'MEDIUM';
  if (/low|minor|style|lint|formatting|comment|typo|optimization/i.test(lower)) return 'LOW';
  return 'INFO';
};

export const extractFileCitation = (line: string): { file: string; lineRange?: string } | null => {
  const fileRegex = /(?:file|path|tệp)?(?::|\s+)?`?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)`?(?::(\d+(?:-\d+)?)|(?:\s*\(?(?:line|dòng)\s*(\d+(?:-\d+)?)\)?))?/i;
  const match = line.match(fileRegex);
  if (!match) return null;
  const file = match[1];
  const lineRange = match[2] || match[3] || undefined;
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') ||
      file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.css') || file.endsWith('.sql')) {
    return { file, lineRange };
  }
  return null;
};

export const parseSubagentFindings = (
  subagentId: string,
  subagentName: string,
  reviewText: string
): DistilledFinding[] => {
  if (!reviewText) return [];
  const findings: DistilledFinding[] = [];
  const lines = reviewText.split('\n');

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (rawLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock && codeBuffer.length > 0) {
        const snippet = codeBuffer.join('\n').slice(0, 1000);
        codeBuffer = [];
        if (findings.length > 0 && !findings[findings.length - 1].suggestedPatchSnippet) {
          findings[findings.length - 1].suggestedPatchSnippet = snippet;
        }
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('VERDICT')) continue;

    const isListItem = /^[-*•\d.]+\s*/.test(rawLine) || /^(?:file|path|issue|warning|critical|error):/i.test(rawLine);
    if (!isListItem) continue;

    const citation = extractFileCitation(rawLine);
    const hasIssueSignal = /(?:issue|vulnerab|lỗi|cần|thiếu|vi phạm|fail|warn|alert|risk|fix|patch|bug|critical)/i.test(rawLine);

    if (citation) {
      const severity = classifyFindingSeverity(rawLine);
      const cleanSummary = rawLine.replace(/^[-*•\d.]+\s*(?:file:?|path:?)?\s*/i, '').replace(/`+/g, '').slice(0, 180);
      findings.push({
        id: `find-${subagentId}-${findings.length + 1}`,
        subagentId,
        subagentName,
        severity,
        fileCitation: citation.file,
        lineRange: citation.lineRange,
        issueSummary: cleanSummary
      });
    } else if (hasIssueSignal) {
      const last = findings[findings.length - 1];
      const severity = classifyFindingSeverity(rawLine);
      const cleanSummary = rawLine.replace(/^[-*•\d.]+\s*(?:issue:?|analysis:?|critical:?)?\s*/i, '').replace(/`+/g, '').slice(0, 180);
      if (last && (last.issueSummary.includes(last.fileCitation) || last.issueSummary.length < 40)) {
        last.issueSummary = cleanSummary;
        if (severity !== 'INFO') last.severity = severity;
      } else {
        findings.push({
          id: `find-${subagentId}-${findings.length + 1}`,
          subagentId,
          subagentName,
          severity,
          fileCitation: 'workspace',
          issueSummary: cleanSummary
        });
      }
    }
  }

  return findings;
};
