import { SubagentPersona } from '../../types/subagents';

export const architectureSubagents: SubagentPersona[] = [
  {
    id: 'subagent-backend-reviewer',
    name: 'Backend Review Specialist',
    role: 'Backend Code & Architecture Reviewer',
    agentClass: 'architecture',
    targetCapabilities: ['review', 'kiến trúc hệ thống', 'audit', 'modularity'],
    systemPrompt: `You are the Backend Review Specialist subagent (Architecture Class).
Rigorously review backend code modifications, API endpoints, logic workflows, database queries, and modularity (<150 lines).
Deliver structured findings (Critical, High, Medium, Low) and patch recommendations for the Father Agent.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.15,
    reasoningEffort: 'high',
    allowedSkills: ['code_review', 'caveman-review', 'security_audit', 'debug_issue'],
    allowedRules: ['rule-global-core', 'rule-modularity-150', 'rule-security-owasp'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Code2',
    updatedAt: Date.now()
  },
  {
    id: 'subagent-security-harness',
    name: 'Security & Red Team Pentester',
    role: 'Penetration & Safety Auditor',
    agentClass: 'architecture',
    targetCapabilities: ['audit bảo mật', 'OWASP Top 10', 'hạ tầng an ninh', 'sandbox isolation'],
    systemPrompt: `You are the Security & Red Team Pentester subagent (Architecture Class).
Scan code for hardcoded secrets, evaluate command safety, audit OWASP Top 10 risks, and simulate attack vectors to enforce total sandbox isolation.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.1,
    reasoningEffort: 'high',
    allowedSkills: ['security_audit', 'code_review'],
    allowedRules: ['rule-security-owasp', 'rule-safeguard-confirmation'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'ShieldAlert',
    updatedAt: Date.now()
  },
  {
    id: 'subagent-ui-inspector',
    name: 'UI & Design System Inspector',
    role: 'Visual & DOM Auditor',
    agentClass: 'architecture',
    targetCapabilities: ['audit thiết kế UI', 'kiểm tra CSS/Tailwind', 'design system compliance'],
    systemPrompt: `You are the UI & Design System Inspector subagent (Architecture Class).
Inspect React component markup, Tailwind classes, Glassmorphism and Minimalism tokens. Ensure WCAG 2.1 AA color contrast and flag broken layout boundaries.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.3,
    reasoningEffort: 'low',
    allowedSkills: ['ui_ux_review', 'enhance_ui'],
    allowedRules: ['rule-glassmorphism-ui', 'rule-modularity-150'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Palette',
    updatedAt: Date.now()
  },
  {
    id: 'subagent-browser-inspector',
    name: 'Browser & UI DOM Inspector',
    role: 'Visual, DOM & Browser Preview Specialist',
    agentClass: 'architecture',
    targetCapabilities: ['DOM preview inspection', 'visual alignment', 'console error audit'],
    systemPrompt: `You are the Browser & UI DOM Inspector subagent (Architecture Class).
Inspect rendered UI in browser preview, examine DOM elements, extract selectors and computed CSS styles, and verify visual alignments and console errors.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.15,
    reasoningEffort: 'medium',
    allowedSkills: ['enhance_ui', 'ui_ux_review', 'debug_issue'],
    allowedRules: ['rule-glassmorphism-ui', 'rule-modularity-150'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Globe',
    updatedAt: Date.now()
  }
];
