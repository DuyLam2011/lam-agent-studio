import React from 'react';
import { ChatMessage } from '../../../store/useAgentStore';
import { ActionWarningNote } from './ActionWarningNote';
import { ClarificationCard } from './ClarificationCard';
import { InteractiveClarificationCard } from '../clarification/InteractiveClarificationCard';
import { findSensitiveToolCalls, detectClarificationInText } from '../../../services/advisory/agentClarificationParser';

export const ChatMessageClarificationSection: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const sensitiveWarnings = findSensitiveToolCalls(message.toolCalls);
  const prediction = message.clarificationPrediction;
  const legacyClarification = !prediction ? detectClarificationInText(message.text) : null;

  if (sensitiveWarnings.length === 0 && !prediction && !legacyClarification) return null;

  return (
    <div className="space-y-2 pt-1">
      {sensitiveWarnings.map((warn, idx) => (
        <ActionWarningNote key={idx} {...warn} />
      ))}
      {prediction && (
        <InteractiveClarificationCard prediction={prediction} />
      )}
      {!prediction && legacyClarification && (
        <ClarificationCard
          plan={legacyClarification.plan}
          options={legacyClarification.options}
          riskAssessment={legacyClarification.riskAssessment}
        />
      )}
    </div>
  );
};
