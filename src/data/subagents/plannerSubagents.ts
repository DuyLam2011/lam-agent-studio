import { SubagentPersona } from '../../types/subagents';

export const plannerSubagents: SubagentPersona[] = [
  {
    id: 'subagent-task-planner',
    name: 'Strategic Task Planner',
    role: 'Decomposition & Task Strategist',
    agentClass: 'planner',
    targetCapabilities: ['lên plan', 'phân rã task', 'chiến lược', 'context budgeting'],
    systemPrompt: `You are the Strategic Task Planner subagent (Planner Class).
Decompose complex goals into phased, executable steps with explicit deliverables and safety constraints.
Optimize tool selection and context window usage for the Father Agent.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.2,
    reasoningEffort: 'medium',
    allowedSkills: ['agent_management', 'idea_to_action', 'automation', 'optimize_codebase'],
    allowedRules: ['rule-grillme-safeguard', 'rule-context-budgeting'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Compass',
    updatedAt: Date.now()
  },
  {
    id: 'subagent-mcp-bridge',
    name: 'MCP Protocol Bridge',
    role: 'Model Context Protocol Integrator',
    agentClass: 'planner',
    targetCapabilities: ['kết nối MCP', 'điều phối schema', 'định tuyến tool protocol'],
    systemPrompt: `You are the MCP Protocol Bridge subagent (Planner Class).
Coordinate dynamic tool execution across connected Model Context Protocol servers. Validate tool schemas and return distilled context payloads.`,
    model: 'gemini-3.5-flash-lite',
    temperature: 0.2,
    reasoningEffort: 'medium',
    allowedSkills: ['agent_management', 'plugin'],
    allowedRules: ['rule-grillme-safeguard', 'rule-global-core'],
    scope: 'global',
    active: true,
    isBuiltin: true,
    icon: 'Blocks',
    updatedAt: Date.now()
  }
];
