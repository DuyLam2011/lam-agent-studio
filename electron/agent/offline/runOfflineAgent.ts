import type { ToolExecutor } from '../tools/ToolExecutor';
import type { AgentResponse, ToolCallResult } from '../types';

const CAPABILITIES = `### L.A.M Agent Engine Ready

I am operating in **Local Agent Mode** (no model provider configured).

**Direct Capabilities (Active Now):**
- Read files: *"Read package.json"*
- Inspect Git: *"Check git status"*
- Directory lookup: *"List files"*
- Execute commands: *Run command \`cmd /c dir\`*

**To Enable Full Autonomous Reasoning:**
1. Open the **Engine** tab in the right panel.
2. Enter your **Google Gemini API Key** (or OpenAI / Ollama endpoint).
3. The agent will then plan, call tools, and stream its reasoning live.`;

/**
 * Deterministic intent matcher used when no model provider is configured, so
 * the most common workspace actions still run through the real tool sandbox.
 */
export const runOfflineAgent = async (userText: string, executor: ToolExecutor, securityMode?: string): Promise<AgentResponse> => {
  const lower = userText.toLowerCase();
  const run = async (id: string, name: string, args: Record<string, unknown>): Promise<ToolCallResult> => {
    const res = await executor.execute(name, args, securityMode);
    return { id, name, args, status: res.status, result: res.result, executionTimeMs: res.executionTimeMs, autoApproved: true };
  };

  if (/git status|check git|git changes/.test(lower)) {
    const tool = await run('tc-git-1', 'git_status', {});
    const st = tool.result || {};
    return {
      text: tool.status === 'success'
        ? `### Git Status Overview\n- **Branch**: \`${st.currentBranch || 'unknown'}\`\n- **Modified**: ${st.modified?.length || 0} files\n- **Untracked**: ${st.not_added?.length || 0} files\n- **Staged**: ${st.staged?.length || 0} files\n\n*Tip: Configure your Gemini API Key in the Engine tab for autonomous reasoning.*`
        : `Could not read git status: ${tool.result}`,
      toolCalls: [tool],
      status: 'completed'
    };
  }

  const readFileMatch = userText.match(/(?:read|show|inspect|view)\s+(?:file\s+)?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)/i);
  if (readFileMatch) {
    const targetFile = readFileMatch[1];
    const tool = await run('tc-read-1', 'read_file', { path: targetFile });
    const content = String(tool.result ?? '');
    return {
      text: tool.status === 'success' ? `### File Content: \`${targetFile}\`\n\n\`\`\`\n${content}\n\`\`\`` : `Could not read \`${targetFile}\`: ${content}`,
      toolCalls: [{ ...tool, result: content.length > 1000 ? `${content.slice(0, 1000)}...` : content }],
      status: 'completed'
    };
  }

  if (/list files|\bdir\b|show files/.test(lower)) {
    const tool = await run('tc-list-1', 'list_directory', { path: '.' });
    const items: Array<{ name: string; isDirectory: boolean }> = Array.isArray(tool.result) ? tool.result : [];
    const dirCount = items.filter((i) => i.isDirectory).length;
    const listing = items.slice(0, 15).map((i) => `- ${i.isDirectory ? '📁' : '📄'} \`${i.name}\``).join('\n');
    return {
      text: `### Workspace Directory Listing\nFound **${items.length - dirCount}** files and **${dirCount}** directories in root.\n\n${listing}${items.length > 15 ? '\n- *...and more*' : ''}`,
      toolCalls: [tool],
      status: 'completed'
    };
  }

  const runCmdMatch = userText.match(/(?:run|exec|execute)\s+(?:command\s+)?["'`]([^"'`]+)["'`]/i);
  if (runCmdMatch) {
    const cmd = runCmdMatch[1];
    const tool = await run('tc-cmd-1', 'run_command', { command: cmd });
    return {
      text: `### Command Execution Result\nCommand: \`${cmd}\`\n\n\`\`\`\n${tool.result}\n\`\`\``,
      toolCalls: [tool],
      status: 'completed'
    };
  }

  return { text: CAPABILITIES, status: 'completed' };
};
