import { AgentFindingItem } from '../types/agent-activity';

export function parseReviewFindings(
  reviewText: string,
  targetLabel: string,
  diffSource: string,
  lineCount: number
): AgentFindingItem[] {
  const findings: AgentFindingItem[] = [];
  const now = Date.now();

  // 1. High-level Overview Finding
  findings.push({
    id: `f-${now}-1`,
    category: 'summary',
    title: `Git Diff Scope: ${targetLabel} (${diffSource})`,
    description: `Analyzed ${lineCount} modified lines in ${diffSource}. Agent extracted structural changes and operational impact.`,
    severity: 'info'
  });

  // 2. Parse Markdown Sections (e.g., ### 1. Summary, ### 2. Code Review, ### 3. Security)
  const sections = reviewText.split(/(?=###?\s+\d*\.?\s*)/g);

  sections.forEach((sec, idx) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const firstLine = trimmed.split('\n')[0].replace(/^###?\s*\d*\.?\s*/, '').trim();
    const content = trimmed.split('\n').slice(1).join('\n').trim();

    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('owasp')) {
      const isCritical = lower.includes('critical') || lower.includes('high risk') || lower.includes('leak');
      findings.push({
        id: `f-${now}-sec-${idx}`,
        category: 'security',
        title: firstLine || 'Security & Isolation Audit',
        description: content.slice(0, 400) || trimmed.slice(0, 300),
        severity: isCritical ? 'high' : 'medium',
        suggestion: 'Review exposed endpoints, verify token scopes, and ensure inputs are sanitized.'
      });
    } else if (lower.includes('critique') || lower.includes('quality') || lower.includes('architecture') || lower.includes('risk')) {
      findings.push({
        id: `f-${now}-crit-${idx}`,
        category: 'bug',
        title: firstLine || 'Architecture & Code Quality Critique',
        description: content.slice(0, 400) || trimmed.slice(0, 300),
        severity: 'low',
        suggestion: 'Verify strict modularity (<150 lines per file) and check for unhandled async rejections.'
      });
    } else if (lower.includes('recommend') || lower.includes('action') || lower.includes('improvement')) {
      findings.push({
        id: `f-${now}-rec-${idx}`,
        category: 'performance',
        title: firstLine || 'Actionable Recommendations',
        description: content.slice(0, 400) || trimmed.slice(0, 300),
        severity: 'low',
        suggestion: '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c "npm run build:vite"'
      });
    }
  });

  // Fallback if no specific markdown sections matched
  if (findings.length === 1) {
    findings.push({
      id: `f-${now}-summary-detail`,
      category: 'summary',
      title: 'Detailed Agent Review Output',
      description: reviewText.slice(0, 500),
      severity: 'info'
    });
  }

  return findings;
}
