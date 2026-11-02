import { ChatMessage } from '../../store/useAgentStore';

export interface ChatFilterState {
  query: string;
  roleFilter: 'all' | 'user' | 'agent' | 'tool' | 'error';
  hasDiffOnly?: boolean;
}

export interface ChatTokenAnalytics {
  estimatedTotalTokens: number;
  userTokens: number;
  agentTokens: number;
  messageCount: number;
  toolCallCount: number;
  percentOfContextWindow: number;
  maxContextWindow: number;
  formattedTokens: string;
}

const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'gemini-3.8-flash': 1_000_000,
  'gemini-3.5-flash': 1_000_000,
  'gemini-3.5-flash-lite': 1_000_000,
  'gemini-flash-lite-latest': 1_000_000,
  'claude-3-7-sonnet-20250219': 200_000,
  'claude-3-5-haiku-20241022': 200_000,
  'deepseek-chat': 64_000,
  'deepseek-reasoner': 64_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000
};

export const estimateMessageTokens = (text = '', thinking = '', toolCallsCount = 0): number => {
  const chars = text.length + thinking.length;
  // Heuristic: ~4 chars per token for code/text + 60 tokens per tool call metadata
  return Math.ceil(chars / 3.8) + (toolCallsCount * 60);
};

export const calculateChatTokenUsage = (messages: ChatMessage[], modelId = 'gemini-3.5-flash-lite'): ChatTokenAnalytics => {
  let userTokens = 0;
  let agentTokens = 0;
  let toolCallCount = 0;

  for (const m of messages) {
    const tCount = m.toolCalls?.length || (m.toolCall ? 1 : 0);
    toolCallCount += tCount;
    const tokens = estimateMessageTokens(m.text, m.thinking || '', tCount);
    if (m.role === 'user') userTokens += tokens;
    else agentTokens += tokens;
  }

  const estimatedTotalTokens = userTokens + agentTokens;
  const maxContextWindow = MODEL_CONTEXT_LIMITS[modelId] || 200_000;
  const percentOfContextWindow = Math.min(100, Math.round((estimatedTotalTokens / maxContextWindow) * 1000) / 10);
  const formattedTokens = estimatedTotalTokens > 1000
    ? `${(estimatedTotalTokens / 1000).toFixed(1)}k`
    : `${estimatedTotalTokens}`;

  return {
    estimatedTotalTokens,
    userTokens,
    agentTokens,
    messageCount: messages.length,
    toolCallCount,
    percentOfContextWindow,
    maxContextWindow,
    formattedTokens
  };
};

export const filterChatMessages = (messages: ChatMessage[], filter: ChatFilterState): ChatMessage[] => {
  const q = filter.query.trim().toLowerCase();

  return messages.filter((m) => {
    // Role filter
    if (filter.roleFilter === 'user' && m.role !== 'user') return false;
    if (filter.roleFilter === 'agent' && m.role !== 'agent') return false;
    if (filter.roleFilter === 'error' && m.status !== 'failed' && !m.error) return false;
    if (filter.roleFilter === 'tool' && (!m.toolCalls || m.toolCalls.length === 0) && !m.toolCall) return false;
    if (filter.hasDiffOnly && (!m.diffSnapshots || m.diffSnapshots.length === 0)) return false;

    // Full text search
    if (!q) return true;
    const inText = m.text?.toLowerCase().includes(q);
    const inThinking = m.thinking?.toLowerCase().includes(q);
    const inTools = m.toolCalls?.some(tc => tc.name.toLowerCase().includes(q) || String(tc.result || '').toLowerCase().includes(q));
    const inError = m.error?.toLowerCase().includes(q);

    return inText || inThinking || inTools || inError;
  });
};
