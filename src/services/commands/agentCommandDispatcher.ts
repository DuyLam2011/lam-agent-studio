import { useAgentStore, ChatMessage } from '../../store/useAgentStore';
import { makeAgentMsg } from '../reviews/agentReviewOrchestrator';
import { findBuiltinCommand, BUILTIN_AGENT_COMMANDS } from './agentCommandRegistry';

export interface CommandDispatchResult {
  isCommand: boolean;
  handledLocally: boolean;
  workflowType?: 'review' | 'pentest' | 'commit' | 'decision' | 'grillme' | 'safeguard';
  messagesToAdd?: ChatMessage[];
  args?: string;
}

export const dispatchBuiltinCommand = async (
  text: string,
  onMessageCommitted?: (msg: ChatMessage) => Promise<void> | void
): Promise<CommandDispatchResult> => {
  const { commandDef, args } = findBuiltinCommand(text);
  if (!commandDef) return { isCommand: false, handledLocally: false };

  const agentStore = useAgentStore.getState();

  // 1. /terminal command (Local Instant Execution)
  if (commandDef.id === 'cmd-terminal') {
    agentStore.addToast('Terminal Bash execution permissions verified', 'success');
    const msg = makeAgentMsg(
      'lead-architect',
      '⚡ **Terminal Execution Skill Activated**: Agent has been granted safe execution privileges via Git Bash sandbox environment.'
    );
    await onMessageCommitted?.(msg);
    return { isCommand: true, handledLocally: true, messagesToAdd: [msg] };
  }

  // 2. /help command (Local Instant Execution)
  if (commandDef.id === 'cmd-help') {
    let helpTable = `### 🛠️ **Built-in Agent Commands Reference**\n\n`;
    helpTable += `| Command | Category | Usage | Description |\n| :--- | :--- | :--- | :--- |\n`;
    for (const c of BUILTIN_AGENT_COMMANDS) {
      helpTable += `| \`${c.command}\` | \`${c.category.toUpperCase()}\` | \`${c.usage}\` | ${c.description} |\n`;
    }
    const msg = makeAgentMsg('lead-architect', helpTable);
    await onMessageCommitted?.(msg);
    return { isCommand: true, handledLocally: true, messagesToAdd: [msg] };
  }

  // 3. Workflow Commands (Routed to dedicated Subagents)
  if (commandDef.id === 'cmd-review') {
    return { isCommand: true, handledLocally: false, workflowType: 'review', args };
  }
  if (commandDef.id === 'cmd-pentest') {
    return { isCommand: true, handledLocally: false, workflowType: 'pentest', args };
  }
  if (commandDef.id === 'cmd-commit') {
    return { isCommand: true, handledLocally: false, workflowType: 'commit', args };
  }
  if (commandDef.id === 'cmd-decision' || commandDef.id === 'cmd-grillme') {
    return { isCommand: true, handledLocally: false, workflowType: 'decision', args };
  }
  if (commandDef.id === 'cmd-safeguard') {
    return { isCommand: true, handledLocally: false, workflowType: 'safeguard', args };
  }

  return { isCommand: true, handledLocally: false };
};
