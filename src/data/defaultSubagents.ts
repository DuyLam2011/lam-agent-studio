import { SubagentPersona } from '../types/subagents';
import { architectureSubagents } from './subagents/architectureSubagents';
import { plannerSubagents } from './subagents/plannerSubagents';
import { executorSubagents } from './subagents/executorSubagents';
import { analyticSubagents } from './subagents/analyticSubagents';

export const standardBuiltinSubagents: SubagentPersona[] = [
  ...architectureSubagents,
  ...plannerSubagents,
  ...executorSubagents,
  ...analyticSubagents
];
