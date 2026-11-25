import { AgentCombo } from '../types/agent-combo';
import { webAndApiCombos } from './combos/webAndApiCombos';
import { ciCdLoopHealerCombo } from './combos/ciCdCombo';

export const standardBuiltinAgentCombos: AgentCombo[] = [
  ...webAndApiCombos,
  ciCdLoopHealerCombo
];
