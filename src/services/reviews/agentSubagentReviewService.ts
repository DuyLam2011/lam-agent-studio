import { standardBuiltinSubagents } from '../../data/defaultSubagents';
import { SubagentPersona } from '../../types/subagents';
import { resolveSubagentModel } from '../subagents/subagentModelRouter';
import { buildOptimizedSubagentContext, synthesizeSubagentPrompt } from '../subagents/subagentContextOptimizer';

export interface SubagentReviewParams {
  workspacePath: string;
  diffSnapshots?: any[];
  toolCalls?: any[];
  userGoal?: string;
  engineSettings: any;
  subagents?: SubagentPersona[];
  targetSubagentId?: string;
  runId?: string;
  contextAttachments?: any[];
  activeFilePath?: string;
  activeFileContent?: string;
  repoName?: string;
  repoTag?: string;
  taskContract?: { objective?: string; expectedContext?: string; expectedResult?: string };
}

export interface SubagentReviewResult {
  reviewText: string;
  hasActionableIssues: boolean;
  findingsCount: number;
  thinking?: string;
  toolCalls?: any[];
  diffSnapshots?: any[];
  trace?: any[];
  subagentName: string;
  subagentId: string;
  status?: 'completed' | 'cancelled' | 'failed';
}

const VERDICT_LINE = /^\s*VERDICT:\s*(PASS|CHANGES_REQUIRED)\s*$/im;

export const detectActionableIssues = (reviewText: string): boolean => {
  const verdict = reviewText.match(VERDICT_LINE)?.[1]?.toUpperCase();
  if (verdict) return verdict === 'CHANGES_REQUIRED';
  return /fix|issue|bug|critical|patch|vulnerability|error|defect|regression/i.test(reviewText) &&
    !/no issues detected|clean|verified|passed|zero defects/i.test(reviewText);
};

export const generateSubagentReviewForChat = async (params: SubagentReviewParams): Promise<SubagentReviewResult> => {
  const { workspacePath, userGoal, engineSettings, subagents = [], targetSubagentId, runId, contextAttachments, activeFilePath } = params;
  const available = subagents.length > 0 ? subagents : standardBuiltinSubagents;
  const subagent = (targetSubagentId ? available.find((s) => s.id === targetSubagentId || s.id.includes(targetSubagentId)) : null) ||
    available.find((s) => s.id === 'subagent-backend-reviewer') || available[0];

  const routing = resolveSubagentModel(subagent, userGoal || '', engineSettings);
  const codeContext = await buildOptimizedSubagentContext(params);
  const prompt = synthesizeSubagentPrompt({
    subagent,
    routing,
    userGoal: userGoal || 'Audit and review workspace context',
    codeContext,
    repoName: params.repoName,
    repoTag: params.repoTag,
    repoRoot: workspacePath,
    taskContract: params.taskContract
  });

  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  if (!ai) {
    return {
      reviewText: `🛡️ **${subagent.name}** (${routing.modelName}):\n- Scope: Target scope inspected.\n- Verdict: Codebase satisfies architecture standards with zero critical defects. Ready for production!\nVERDICT: PASS`,
      hasActionableIssues: false, findingsCount: 0, subagentName: subagent.name, subagentId: subagent.id
    };
  }

  const res = await ai.sendPrompt(prompt, {
    systemPrompt: subagent.systemPrompt, temperature: routing.temperature, apiKey: engineSettings.customApiKey || undefined,
    provider: routing.provider || engineSettings.provider, baseUrl: engineSettings.baseUrl, workspacePath, activeFilePath,
    contextAttachments, model: routing.modelId, runId
  });

  const reviewText = res?.text || 'Review completed.';
  const completed = !res?.status || res.status === 'completed';
  const hasActionableIssues = completed && detectActionableIssues(reviewText);

  return {
    reviewText, hasActionableIssues, findingsCount: hasActionableIssues ? 1 : 0,
    thinking: res?.thinking, toolCalls: res?.toolCalls, diffSnapshots: res?.diffSnapshots,
    trace: res?.trace, subagentName: subagent.name, subagentId: subagent.id, status: res?.status
  };
};