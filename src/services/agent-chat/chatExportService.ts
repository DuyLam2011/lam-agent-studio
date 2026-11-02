import { ChatMessage } from '../../store/useAgentStore';
import { Conversation } from '../../types/conversation';
import { calculateChatTokenUsage } from './chatFilterService';

export const formatQuotePrompt = (message: ChatMessage): string => {
  const roleName = message.role === 'user' ? 'User' : (message.agentRole || 'AI Agent');
  const excerpt = message.text.split('\n').slice(0, 3).join('\n').trim();
  const truncated = message.text.split('\n').length > 3 ? `${excerpt}\n...` : excerpt;
  return `> [${roleName}]: ${truncated.replace(/\n/g, '\n> ')}\n\n`;
};

export const exportConversationAsMarkdown = (conversation?: Conversation, messages: ChatMessage[] = []): string => {
  const title = conversation?.title || 'L.A.M Agent Chat Session';
  const dateStr = new Date(conversation?.createdAt || Date.now()).toLocaleString();
  const model = conversation?.model || 'default';
  const tokens = calculateChatTokenUsage(messages, model);

  const lines: string[] = [
    `# 🤖 ${title}`,
    ``,
    `> **Exported from L.A.M Agent Studio** on ${new Date().toLocaleString()}`,
    ``,
    `| Attribute | Value |`,
    `| :--- | :--- |`,
    `| **Session Date** | ${dateStr} |`,
    `| **Model Engine** | \`${model}\` |`,
    `| **Security Mode** | \`${conversation?.securityMode || 'guarded'}\` |`,
    `| **Messages Count** | ${messages.length} |`,
    `| **Estimated Tokens** | ~${tokens.formattedTokens} tokens (${tokens.percentOfContextWindow}% of ${tokens.maxContextWindow.toLocaleString()} limit) |`,
    ``,
    `---`,
    ``
  ];

  messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const roleTitle = isUser ? '👤 User' : `🤖 ${msg.agentRole || 'Father Agent'}`;
    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '';

    lines.push(`## [${idx + 1}] ${roleTitle} ${timeStr ? `\`${timeStr}\`` : ''}`);
    lines.push('');

    if (msg.thinking) {
      lines.push('<details>');
      lines.push('<summary>🧠 <i>Reasoning & Planning Stream</i></summary>');
      lines.push('');
      lines.push('```text');
      lines.push(msg.thinking.trim());
      lines.push('```');
      lines.push('</details>');
      lines.push('');
    }

    if (msg.toolCalls && msg.toolCalls.length > 0) {
      lines.push('<details>');
      lines.push(`<summary>⚡ <i>Tool Calls Executed (${msg.toolCalls.length})</i></summary>`);
      lines.push('');
      msg.toolCalls.forEach((tc) => {
        lines.push(`- **Tool:** \`${tc.name}\` · Status: \`${tc.status}\``);
        lines.push('```json');
        lines.push(JSON.stringify(tc.args, null, 2));
        lines.push('```');
      });
      lines.push('</details>');
      lines.push('');
    }

    lines.push(msg.text.trim() || '*(No response text)*');
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
};

export const exportConversationAsJson = (conversation?: Conversation, messages: ChatMessage[] = []): string => {
  return JSON.stringify({
    version: '1.0.0',
    exportedAt: Date.now(),
    conversation: { ...conversation, messages }
  }, null, 2);
};

export const downloadChatTranscript = (title: string, content: string, format: 'md' | 'json'): void => {
  if (typeof window === 'undefined') return;
  const mime = format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8';
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 40);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
