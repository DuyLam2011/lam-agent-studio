import { ChatMessage, useAgentStore } from '../../store/useAgentStore';
import { newId, upsertMessage } from '../agent-chat/agentRunStreamer';
import { predictClarificationNeeds } from './userClarificationPredictor';

export interface ClarificationCheckParams {
  activeFilePath?: string;
  history?: any[];
  conversationId: string;
}

export const checkAndDispatchClarification = async (
  text: string,
  params: ClarificationCheckParams,
  workflowType?: string
): Promise<boolean> => {
  const decisionLevel = useAgentStore.getState().engineSettings.agentDecisionLevel || 'balanced';
  const prediction = predictClarificationNeeds(text, {
    activeFilePath: params.activeFilePath,
    history: params.history,
    decisionLevel
  });

  if (workflowType === 'decision' || workflowType === 'grillme' || prediction.needsClarification) {
    const isExhaustive = decisionLevel === 'rigorous' || workflowType === 'decision';
    const msg: ChatMessage = {
      id: newId('msg'),
      role: 'agent',
      agentRole: 'lead-architect',
      timestamp: Date.now(),
      status: 'completed',
      text: `🎯 **Agent Decision & Context Verification Gate** (${decisionLevel.toUpperCase()})\n\nIdentified **${prediction.questions.length} prerequisite decision(s)** (${prediction.summary}).\n\n> 🛡️ *${isExhaustive ? 'Socratic Decision Interview: resolve design choices below before implementation.' : 'Review the recommended options below and click **Confirm & Execute Decisions** to proceed.'}*`,
      clarificationPrediction: prediction
    };
    await upsertMessage(params.conversationId, msg);
    return true;
  }

  return false;
};
