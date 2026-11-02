import { SubagentRecommendation } from './chatPromptOptimizerService';

export const matchSubagentsForPrompt = (inputText: string): SubagentRecommendation[] => {
  const lower = (inputText || '').toLowerCase();
  const subagentRecs: SubagentRecommendation[] = [];

  if (/security|owasp|leak|secret|vulnerab|sanitize|auth|inject/i.test(lower)) {
    subagentRecs.push({
      id: 'subagent-security-harness',
      name: 'Security & Red Team Pentester',
      tag: '@security-harness',
      role: 'OWASP & Secrets Auditor',
      reason: 'Specializes in input sanitization, cryptography, and zero-leak auditing.',
      confidence: 0.95
    });
  }

  if (/review|audit|diff|branch|commit|git|architecture|rule/i.test(lower)) {
    subagentRecs.push({
      id: 'subagent-backend-reviewer',
      name: 'Backend Review Specialist',
      tag: '@backend-reviewer',
      role: 'Git Diff & Architecture Reviewer',
      reason: 'Audits Rule 3 (<150 lines) modularity, exception handling, and creates patches.',
      confidence: 0.92
    });
  }

  if (/error|log|stack|trace|crash|exception|fail|terminal|pty/i.test(lower)) {
    subagentRecs.push({
      id: 'subagent-log-analyzer',
      name: 'Log & Runtime Diagnostician',
      tag: '@log-analyzer',
      role: 'Terminal & Stack Trace Diagnostician',
      reason: 'Strips noisy terminal output and isolates the exact root cause and line number.',
      confidence: 0.90
    });
  }

  if (/ui|css|tailwind|style|responsive|color|contrast|layout|modal|button/i.test(lower)) {
    subagentRecs.push({
      id: 'subagent-ui-inspector',
      name: 'UI & Design System Inspector',
      tag: '@ui-inspector',
      role: 'Visual & DOM Inspector',
      reason: 'Enforces WCAG 2.1 contrast, clean minimalist tokens, and responsive layout boundaries.',
      confidence: 0.88
    });
  }

  if (/test|qa|regression|check|verify|coverage/i.test(lower)) {
    subagentRecs.push({
      id: 'subagent-qa-reviewer',
      name: 'QA & Anti-Regression Reviewer',
      tag: '@qa-reviewer',
      role: 'Test Runner & Regression Guard',
      reason: 'Runs automated verification and guarantees no existing features were broken.',
      confidence: 0.85
    });
  }

  if (/browser|dom|inspect|element|preview|selector|render|devserver|localhost/i.test(lower)) {
    subagentRecs.push({
      id: 'subagent-browser-inspector',
      name: 'Browser & UI DOM Inspector',
      tag: '@browser-inspector',
      role: 'Browser Preview & DOM Hierarchy Auditor',
      reason: 'Inspects live rendered DOM elements, hierarchy, computed CSS styles, and console errors.',
      confidence: 0.94
    });
  }

  return subagentRecs;
};
