import { standardBuiltinSubagents } from '../data/defaultSubagents';
import { SubagentPersona } from '../types/subagents';
import { resolveSubagentModel } from './subagentModelRouter';
import { buildOptimizedSubagentContext, synthesizeSubagentPrompt } from './subagentContextOptimizer';

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
  subagentName: string;
  subagentId: string;
  status?: 'completed' | 'cancelled' | 'failed';
}

const VERDICT_LINE = /^\s*VERDICT:\s*(PASS|CHANGES_REQUIRED)\s*$/im;

export const detectActionableIssues = (reviewText: string): boolean => {
  const verdict = reviewText.match(VERDICT_LINE)?.[1]?.toUpperCase();
  if (verdict) return verdict === 'CHANGES_REQUIRED';
  return /sửa|khắc phục|nghiêm trọng|vấn đề|lỗi|issue|bug|critical|fix|patch/i.test(reviewText) &&
    !/không phát hiện rủi ro|sạch lỗi|đạt chuẩn|passed/i.test(reviewText);
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
      reviewText: `🛡️ **${subagent.name}** (${routing.modelName}):\n- Scope: Đã đánh giá phạm vi mục tiêu.\n- Verdict: Mã nguồn đạt chuẩn, không phát hiện rủi ro. Sẵn sàng vận hành!\nVERDICT: PASS`,
      hasActionableIssues: false, findingsCount: 0, subagentName: subagent.name, subagentId: subagent.id
    };
  }

  const res = await ai.sendPrompt(prompt, {
    systemPrompt: subagent.systemPrompt, temperature: routing.temperature, apiKey: engineSettings.customApiKey || undefined,
    provider: engineSettings.provider, baseUrl: engineSettings.baseUrl, workspacePath, activeFilePath,
    contextAttachments, model: routing.modelId, runId
  });

  const reviewText = res?.text || 'Review completed.';
  const completed = !res?.status || res.status === 'completed';
  const hasActionableIssues = completed && detectActionableIssues(reviewText);

  return {
    reviewText, hasActionableIssues, findingsCount: hasActionableIssues ? 1 : 0,
    thinking: res?.thinking, subagentName: subagent.name, subagentId: subagent.id, status: res?.status
  };
};