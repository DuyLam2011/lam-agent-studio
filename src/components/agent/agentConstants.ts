export interface ModelDefinition {
  id: string;
  name: string;
  provider: 'Google' | 'Anthropic' | 'DeepSeek' | 'OpenAI' | 'Local';
  contextWindow: number;
  badge: string;
  recommended?: boolean;
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  {
    id: 'auto-smart-router',
    name: 'Auto (Smart Router)',
    provider: 'Google',
    contextWindow: 1048576,
    badge: 'Dynamic • Task Complexity',
    recommended: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    contextWindow: 1048576,
    badge: '1M Context • Fast Frontier',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    contextWindow: 2097152,
    badge: '2M Context • Deep Reasoning',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    contextWindow: 1048576,
    badge: 'Multimodal • Tool Calls',
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    badge: 'Hybrid Think',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    contextWindow: 128000,
    badge: 'Reasoning King',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omniscient',
    provider: 'OpenAI',
    contextWindow: 128000,
    badge: 'Fast Multi-Modal',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    badge: 'Top Coder',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    contextWindow: 128000,
    badge: 'Ultra Fast',
  },
  {
    id: 'local-ollama',
    name: 'Ollama Qwen2.5-Coder',
    provider: 'Local',
    contextWindow: 64000,
    badge: 'Airgapped Private',
  },
];

export interface SlashCommand {
  command: string;
  description: string;
  prompt: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/fix-errors',
    description: 'Diagnose and fix syntax/type errors in active file',
    prompt: 'Inspect active file and active diagnostics, identify root cause and provide complete, verified fix.',
  },
  {
    command: '/explain',
    description: 'Deep architectural walkthrough of selected code',
    prompt: 'Provide concise architectural explanation of this code, data flow, and key design decisions.',
  },
  {
    command: '/refactor',
    description: 'Refactor for modularity (<150 lines) and strict typing',
    prompt: 'Refactor current component into modular, single-responsibility units keeping each under 150 lines.',
  },
  {
    command: '/generate-tests',
    description: 'Generate unit tests covering edge cases',
    prompt: 'Write comprehensive test suite covering happy paths, edge cases, and error boundaries.',
  },
  {
    command: '/commit',
    description: 'Generate conventional commit message from git diff',
    prompt: 'Analyze git diff and draft a concise, conventional git commit message with bullet points.',
  },
  {
    command: '/security-audit',
    description: 'Scan active context for OWASP Top 10 vulnerabilities',
    prompt: 'Perform rigorous security review covering injection, unsanitized inputs, and memory leaks.',
  },
  {
    command: '/recommend-combo',
    description: 'Audit workspace stack and recommend optimal Agent Combo ensemble',
    prompt: 'Evaluate this workspace architecture, dependencies, and structure to determine and recommend the best Agent Combo.',
  },
  {
    command: '/decision',
    description: 'Agent Decision Level: Socratic clarification interview, missing context, and option selection',
    prompt: 'Activate AGENT DECISION LEVEL Interview at MAXIMUM RIGOR. Do not mutate code. Point out all missing context, outline your preliminary plan, ask targeted questions (options A, B, C with recommendations) and require user decision.',
  },
  {
    command: '/safeguard',
    description: 'Safeguard gate: inspect high-risk commands and require explicit user confirmation',
    prompt: 'Activate SAFEGUARD CONFIRMATION GATE. Inspect all pending risky operations and explicitly ask user confirmation ("Ask user whether to execute these commands") with impact and risk.',
  },
];
