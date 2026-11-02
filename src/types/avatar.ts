export type AvatarStyle = 'pixel' | 'lowpoly' | 'cyberpunk' | 'minimal' | 'origami';

export type AgentRoleType =
  | 'user'
  | 'lead-architect'
  | 'subagent-task-planner'
  | 'subagent-code-executor'
  | 'subagent-backend-reviewer'
  | 'subagent-qa-reviewer'
  | 'subagent-log-analyzer'
  | 'subagent-ui-inspector'
  | 'subagent-mcp-bridge'
  | 'subagent-security-harness'
  | 'subagent-browser-inspector';

export interface AgentVisualMeta {
  id: AgentRoleType;
  displayName: string;
  badgeLabel: string;
  themeColor: string;
  glowColor: string;
  description: string;
}

export const AGENT_VISUAL_REGISTRY: Record<AgentRoleType, AgentVisualMeta> = {
  'user': {
    id: 'user',
    displayName: 'You (Developer)',
    badgeLabel: 'USER',
    themeColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    description: 'Human Pilot & System Architect'
  },
  'lead-architect': {
    id: 'lead-architect',
    displayName: 'Father Agent',
    badgeLabel: 'FATHER AGENT',
    themeColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    description: 'Autonomous Father Agent & Chief Orchestrator'
  },
  'subagent-task-planner': {
    id: 'subagent-task-planner',
    displayName: 'Strategic Task Planner',
    badgeLabel: 'PLANNER',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Decomposition, Subtask Contracts & Strategy Specialist'
  },
  'subagent-code-executor': {
    id: 'subagent-code-executor',
    displayName: 'Core Code Executor',
    badgeLabel: 'EXECUTOR',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    description: 'Autonomous Coding, Script Runner & Patch Executor'
  },
  'subagent-backend-reviewer': {
    id: 'subagent-backend-reviewer',
    displayName: 'Backend Review Specialist',
    badgeLabel: 'BACKEND REVIEW',
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    description: 'Backend Code, API & Logic Reviewer'
  },
  'subagent-qa-reviewer': {
    id: 'subagent-qa-reviewer',
    displayName: 'QA & Diff Reviewer',
    badgeLabel: 'REVIEW',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    description: 'Code Integrity & Diff Specialist'
  },
  'subagent-log-analyzer': {
    id: 'subagent-log-analyzer',
    displayName: 'Terminal Diagnostician',
    badgeLabel: 'DEBUG',
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Log, Error & PTY Terminal Watchdog'
  },
  'subagent-ui-inspector': {
    id: 'subagent-ui-inspector',
    displayName: 'UI/UX Inspector',
    badgeLabel: 'DESIGN',
    themeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    description: 'Glassmorphism & DOM Token Auditor'
  },
  'subagent-mcp-bridge': {
    id: 'subagent-mcp-bridge',
    displayName: 'MCP Protocol Bridge',
    badgeLabel: 'MCP',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    description: 'Model Context Protocol Integrator'
  },
  'subagent-security-harness': {
    id: 'subagent-security-harness',
    displayName: 'Security Harness',
    badgeLabel: 'SEC',
    themeColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Sandbox & Sensitive Shield Auditor'
  },
  'subagent-browser-inspector': {
    id: 'subagent-browser-inspector',
    displayName: 'Browser DOM Inspector',
    badgeLabel: 'BROWSER',
    themeColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    description: 'DOM Hierarchy & Visual Preview Auditor'
  }
};
