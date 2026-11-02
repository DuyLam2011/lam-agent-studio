import { useEffect } from 'react';
import { useAgentRunStore } from '../../store/useAgentRunStore';
import { ensureAgentEventBridge } from '../../services/agent-chat/agentEventBridge';
import { cancelActiveRun, sendChatMessage } from '../../services/agent-chat/agentRunService';

export const useAgentChatRunner = () => {
  const isThinking = useAgentRunStore((s) => s.isBusy);

  useEffect(() => {
    ensureAgentEventBridge();
  }, []);

  return { isThinking, handleSendMessage: sendChatMessage, cancelRun: cancelActiveRun };
};
