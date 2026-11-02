export type ThoughtAnomalyType =
  | 'THOUGHT_LOOP'
  | 'TOOL_STAGNATION'
  | 'HALLUCINATED_CLAIM'
  | 'UNGROUNDED_ASSUMPTION';

export interface ThoughtIntervention {
  anomalyType: ThoughtAnomalyType;
  reason: string;
  correctiveDirective: string;
  forceNextTurn?: boolean;
}

export interface TurnAnalysisContext {
  turn: number;
  maxTurns: number;
  userText: string;
  currentThinkingChunk: string;
  allThinking: string;
  currentText: string;
  toolCalls: any[];
  executedHistory: any[];
}
