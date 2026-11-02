import { AgentClassType, AGENT_CLASS_REGISTRY } from '../types/agent-class';
import { SubagentPersona } from '../types/subagents';

export interface ClassMatchingResult {
  agentClass: AgentClassType;
  confidence: number;
  matchedKeywords: string[];
  recommendedSkills: string[];
  directive: string;
}

const CLASS_KEYWORDS: Record<AgentClassType, string[]> = {
  architecture: [
    'review', 'audit', 'bảo mật', 'owasp', 'hạ tầng', 'modularity',
    'kiến trúc', 'design system', 'kiểm tra lỗi', 'security', 'inspect',
    'contrast', 'wcag', 'monolith', 'refactor structure'
  ],
  planner: [
    'lên plan', 'kế hoạch', 'chia việc', 'chiến lược', 'roadmap',
    'phân tích bài toán', 'context budgeting', 'workflow', 'orchestrat',
    'decompose', 'định hướng', 'tổ chức task', 'plan'
  ],
  executor: [
    'viết code', 'chạy lệnh', 'thực thi', 'fix', 'sửa lỗi', 'run test',
    'terminal', 'bash', 'build', 'commit', 'patch', 'tạo file', 'implement',
    'chạy script', 'debug runtime'
  ]
};

export const resolveAgentClassForTask = (prompt: string): AgentClassType => {
  const normalized = prompt.toLowerCase();
  const scores: Record<AgentClassType, number> = {
    architecture: 0,
    planner: 0,
    executor: 0
  };

  (Object.keys(CLASS_KEYWORDS) as AgentClassType[]).forEach((cls) => {
    CLASS_KEYWORDS[cls].forEach((kw) => {
      if (normalized.includes(kw.toLowerCase())) {
        scores[cls] += 1;
      }
    });
  });

  if (scores.planner > scores.architecture && scores.planner > scores.executor) {
    return 'planner';
  }
  if (scores.architecture > scores.planner && scores.architecture > scores.executor) {
    return 'architecture';
  }
  // Default to executor for concrete implementation queries
  return 'executor';
};

export const filterSubagentsByClass = (
  subagents: SubagentPersona[],
  targetClass: AgentClassType
): SubagentPersona[] => {
  return subagents.filter((sub) => sub.agentClass === targetClass);
};

export const matchSkillsAndRulesForClass = (
  agentClass: AgentClassType,
  availableSkills: string[] = [],
  availableRules: string[] = []
): { recommendedSkills: string[]; matchedRules: string[] } => {
  const meta = AGENT_CLASS_REGISTRY[agentClass];
  const recommendedSkills = availableSkills.filter((skill) =>
    meta.recommendedSkills.includes(skill)
  );

  const matchedRules = availableRules.filter((rule) => {
    const r = rule.toLowerCase();
    if (agentClass === 'architecture') return r.includes('security') || r.includes('ui') || r.includes('layout') || r.includes('modularity') || r.includes('core');
    if (agentClass === 'planner') return r.includes('intelligence') || r.includes('grillme') || r.includes('workflow') || r.includes('budget') || r.includes('plan');
    return r.includes('terminal') || r.includes('safeguard') || r.includes('shell') || r.includes('placeholder') || r.includes('code');
  });

  return { recommendedSkills, matchedRules };
};

export const getFatherAgentDirective = (
  targetClass: AgentClassType,
  subagentsCount: number = 0
): string => {
  const subagentText = subagentsCount > 0 ? ` coordinating ${subagentsCount} ${targetClass} subagents` : '';

  switch (targetClass) {
    case 'architecture':
      return `[FATHER AGENT DIRECTIVE - ARCHITECTURE] You are the Father Agent (Architecture Lead)${subagentText}. Rigorously audit architecture, security (OWASP), and enforce strict modularity (<150 lines per file). Validate system invariants before certifying approval.`;
    case 'planner':
      return `[FATHER AGENT DIRECTIVE - PLANNER] You are the Father Agent (Strategic Orchestrator)${subagentText}. Decompose the user objective into modular milestones with unambiguous contracts, context budgeting, and clear risk mitigation paths.`;
    case 'executor':
    default:
      return `[FATHER AGENT DIRECTIVE - EXECUTOR] You are the Father Agent (Chief Executor)${subagentText}. Supervise surgical code mutations, verify clean bash execution with Git Bash, guarantee zero placeholders, and run automated verification.`;
  }
};
