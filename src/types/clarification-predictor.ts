export type ClarificationCategory =
  | 'prerequisite_missing'
  | 'destructive_risk'
  | 'architectural_tradeoff'
  | 'ambiguous_scope'
  | 'dependency_choice';

export interface PredictedPrerequisite {
  key: string;
  label: string;
  status: 'present' | 'missing' | 'ambiguous';
  detail?: string;
}

export interface PredictiveQuestionOption {
  id: string;
  label: string;
  description: string;
  badge?: string; // e.g. '(Recommended)', '⚡ Speed', '🔒 Secure'
  impact: string;
  isRecommended?: boolean;
  promptDirective: string;
}

export interface PredictiveQuestion {
  id: string;
  question: string;
  category: ClarificationCategory;
  isMultiSelect?: boolean;
  options: PredictiveQuestionOption[];
}

export interface ClarificationPrediction {
  needsClarification: boolean;
  necessityScore: number; // 0 - 100
  category: ClarificationCategory;
  summary: string;
  inferredRisks: string[];
  prerequisites: PredictedPrerequisite[];
  questions: PredictiveQuestion[];
  recommendedAnswerSummary: string;
  directiveMarkdown?: string;
}

export interface ClarificationUserSelection {
  questionId: string;
  selectedOptionIds: string[];
  customNote?: string;
}
