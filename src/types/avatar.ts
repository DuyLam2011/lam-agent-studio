export type AvatarStyle = 'pixel' | 'lowpoly' | 'cyberpunk' | 'minimal' | 'origami';

export type AgentRoleType =
  | 'user'
  | 'lead-architect'
  | 'subagent-qa-reviewer'
  | 'subagent-log-analyzer'
  | 'subagent-ui-inspector'
  | 'subagent-mcp-bridge'
  | 'subagent-security-harness';

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
    displayName: 'Lead Architect & Engineer',
    badgeLabel: 'LEAD',
    themeColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    description: 'Autonomous Chief Coding Agent'
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
  }
};
