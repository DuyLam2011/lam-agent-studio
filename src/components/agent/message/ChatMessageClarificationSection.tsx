import React from 'react';
import { ChatMessage } from '../../../store/useAgentStore';
import { ActionWarningNote } from './ActionWarningNote';
import { ClarificationCard } from './ClarificationCard';
import { findSensitiveToolCalls, detectClarificationInText } from '../../../services/agentClarificationParser';

export const ChatMessageClarificationSection: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const sensitiveWarnings = findSensitiveToolCalls(message.toolCalls);
  const clarification = detectClarificationInText(message.text);

  if (sensitiveWarnings.length === 0 && !clarification) return null;

  return (
    <div className="space-y-1.5 pt-1">
      {sensitiveWarnings.map((warn, idx) => (
        <ActionWarningNote key={idx} {...warn} />
      ))}
      {clarification && (
        <ClarificationCard
          plan={clarification.plan}
          options={clarification.options}
          riskAssessment={clarification.riskAssessment}
        />
      )}
    </div>
  );
};
