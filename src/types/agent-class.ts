export type AgentClassType = 'architecture' | 'planner' | 'executor' | 'analytic';

export interface AgentClassMeta {
  id: AgentClassType;
  name: string;
  displayName: string;
  badgeLabel: string;
  icon: string;
  themeColor: string;
  bgBadge: string;
  borderColor: string;
  description: string;
  targetCapabilities: string[];
  recommendedSkills: string[];
  defaultReasoningEffort: 'low' | 'medium' | 'high';
}

export const AGENT_CLASS_REGISTRY: Record<AgentClassType, AgentClassMeta> = {
  architecture: {
    id: 'architecture',
    name: 'Architecture',
    displayName: 'Architecture & Quality Guardian',
    badgeLabel: 'ARCHITECTURE',
    icon: 'Building2',
    themeColor: '#a855f7',
    bgBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    description: 'Specializes in architecture review, OWASP security audits, modularity checks (<150 lines), and infrastructure design.',
    targetCapabilities: ['review', 'security audit', 'system architecture', 'audit', 'infrastructure', 'modularity'],
    recommendedSkills: ['code_review', 'security_audit', 'ui_ux_review', 'document_api'],
    defaultReasoningEffort: 'high'
  },
  planner: {
    id: 'planner',
    name: 'Planner',
    displayName: 'Strategic Decomposition Planner',
    badgeLabel: 'PLANNER',
    icon: 'Compass',
    themeColor: '#f59e0b',
    bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    description: 'Specializes in project planning, task decomposition into clear contracts, resource allocation, and context budgeting.',
    targetCapabilities: ['planning', 'task decomposition', 'strategy', 'workflow optimization', 'context budgeting'],
    recommendedSkills: ['agent_management', 'idea_to_action', 'automation', 'optimize_codebase', 'daily_log'],
    defaultReasoningEffort: 'medium'
  },
  executor: {
    id: 'executor',
    name: 'Executor',
    displayName: 'Autonomous Code & Command Executor',
    badgeLabel: 'EXECUTOR',
    icon: 'Zap',
    themeColor: '#10b981',
    bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    description: 'Specializes in writing code, applying surgical patches, running Bash commands, fixing runtime logs, and executing automated tests.',
    targetCapabilities: ['code generation', 'terminal commands', 'patching', 'runtime debugging', 'running tests', 'script execution'],
    recommendedSkills: ['debug_issue', 'enhance_ui', 'create_launcher', 'caveman-commit', 'release_helper'],
    defaultReasoningEffort: 'low'
  },
  analytic: {
    id: 'analytic',
    name: 'Analytic',
    displayName: 'Analytical & Intelligence Specialist',
    badgeLabel: 'ANALYTIC',
    icon: 'LineChart',
    themeColor: '#06b6d4',
    bgBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderColor: 'border-cyan-500/40',
    description: 'Specializes in repository structural analysis, capability extraction, skill synthesis, and English evaluation suite engineering.',
    targetCapabilities: ['repo scanning', 'pattern discovery', 'capability analysis', 'skill synthesis', 'eval engineering'],
    recommendedSkills: ['code_review', 'document_api', 'security_audit', 'optimize_codebase'],
    defaultReasoningEffort: 'high'
  }
};

export const getAgentClassMeta = (classType?: AgentClassType): AgentClassMeta => {
  return (classType && AGENT_CLASS_REGISTRY[classType]) || AGENT_CLASS_REGISTRY.executor;
};
