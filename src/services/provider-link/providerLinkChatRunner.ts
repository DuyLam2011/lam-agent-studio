import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { ProviderLinkConfig } from '../../types/provider-link';
import { executeProviderLinkFlow } from './providerLinkOrchestrator';
import { sendPromptSafely } from '../agent-chat/leadOptionsBuilder';

export const runProviderLinkWorkflow = async (params: {
  text: string;
  config: ProviderLinkConfig;
  beginRun: (agentRole: string) => string;
}): Promise<{ messagesToAdd: ChatMessage[]; diffsToAdd: any[] }> => {
  const { text, config, beginRun } = params;
  const agent = useAgentStore.getState();

  const runner = async (provider: string, model: string, prompt: string) => {
    const runId = beginRun(`link:${provider}`);
    const res = await sendPromptSafely(prompt, {
      aiProvider: provider,
      selectedModel: model,
      workspacePath: agent.systemContext?.cwd,
      activeFilePath: agent.activeFile?.path,
      runId
    });
    return {
      text: res?.text || res?.response || '',
      thinking: res?.thinking
    };
  };

  const result = await executeProviderLinkFlow(text, config, runner);

  const synthesisMessage: ChatMessage = {
    id: `msg_link_${Date.now()}`,
    role: 'agent',
    text: result.finalText,
    timestamp: Date.now(),
    agentRole: `link:${config.sourceProvider}➔${config.targetProvider}`
  };

  return {
    messagesToAdd: [synthesisMessage],
    diffsToAdd: []
  };
};
