import React from 'react';
import { DecisionInterviewPanel } from './DecisionInterviewPanel';
import { DecisionQuestion } from '../../../../types/ai-architect';

export const GrillMeInterviewPanel: React.FC<{
  questions: DecisionQuestion[];
  onSelectOption: (questionId: string, optionKey: string) => void;
  onApplyRecommendedAll: () => void;
  onProceedSynthesis: () => void;
  isSynthesizing: boolean;
}> = (props) => <DecisionInterviewPanel {...props} />;
