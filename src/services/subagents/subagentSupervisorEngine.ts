import { generateSubagentReviewForChat, SubagentReviewParams, SubagentReviewResult } from '../reviews/agentSubagentReviewService';

export interface QualityEvaluation {
  isAdequate: boolean;
  score: number;
  missingAspects: string[];
  critique: string;
}

export interface SupervisedExecutionResult extends SubagentReviewResult {
  supervisedIterations: number;
  qualityScore: number;
  supervisorNotes?: string;
}

export const evaluateSubagentOutputQuality = (reviewText: string, targetSubagentId?: string): QualityEvaluation => {
  const missingAspects: string[] = [];
  let score = 50;

  if (!reviewText || reviewText.trim().length < 80) {
    missingAspects.push('Response too brief, lacking analytical evidence');
    score -= 30;
  }

  const hasCitations = /(?:\.ts|\.tsx|\.js|\.json|\.md|line\s*\d+|function|class|api|component|diff|endpoint|route|token|auth|guard|middleware)/i.test(reviewText);
  if (hasCitations) {
    score += 25;
  } else {
    missingAspects.push('Missing explicit references to files, line numbers, or code context');
  }

  const isReviewer = /(?:review|audit|eval|evaluator|security)/i.test(targetSubagentId || '');
  if (isReviewer) {
    const hasVerdict = /(?:VERDICT|PASS|CHANGES_REQUIRED|verdict|confirmed|verified|clean|secure|vulnerab|audit)/i.test(reviewText);
    if (hasVerdict) score += 25;
    else missingAspects.push('Missing definitive assessment verdict (PASS or CHANGES_REQUIRED)');
  } else {
    const hasActionable = /(?:plan|step|task|implement|create|update|add|fix|refactor|code|test|command|diff|solution|import|export)/i.test(reviewText);
    if (hasActionable) score += 25;
    else missingAspects.push('Missing actionable steps or implementation details');
  }

  const isAdequate = score >= 60 && missingAspects.length === 0;
  const critique = isAdequate
    ? 'Output satisfies evaluation standards with sufficient context.'
    : `Requirements missing: ${missingAspects.join('; ')}.`;

  return { isAdequate, score: Math.max(0, Math.min(100, score)), missingAspects, critique };
};

export const executeSupervisedSubagent = async (
  params: SubagentReviewParams,
  onFeedbackNotice?: (note: string) => Promise<void> | void
): Promise<SupervisedExecutionResult> => {
  const initial = await generateSubagentReviewForChat(params);
  const evalResult = evaluateSubagentOutputQuality(initial.reviewText, params.targetSubagentId);
  const isProcessError = /exited with code|failed to spawn|timed out|error:/i.test(initial.reviewText);
  const isRapidOrAutonomous = params.engineSettings?.hardworkLevel === 'rapid' || params.engineSettings?.agentDecisionLevel === 'autonomous';

  // In rapid/autonomous mode or if adequate, complete immediately in 1 iteration!
  if (!evalResult.isAdequate && !isRapidOrAutonomous && initial.status !== 'cancelled' && !isProcessError && !params.userGoal?.includes('[Father Agent Supervisor Critique]')) {
    const notice = `🔄 **[Father Agent Supervision]**: Analysis from **${initial.subagentName}** lacked sufficient context (${evalResult.missingAspects.join(', ')}). Requesting deep context iteration...`;
    await onFeedbackNotice?.(notice);

    const supervisorPrompt = `${params.userGoal || ''}\n\n[Father Agent Supervisor Critique]: Your previous output was evaluated as lacking context: ${evalResult.critique}. You MUST cite specific code files, functions, lines, and provide a concrete analysis.`;

    const refined = await generateSubagentReviewForChat({
      ...params,
      userGoal: supervisorPrompt
    });

    const refinedEval = evaluateSubagentOutputQuality(refined.reviewText, params.targetSubagentId);
    return {
      ...refined,
      supervisedIterations: 2,
      qualityScore: refinedEval.score,
      supervisorNotes: `Đã qua 2 vòng giám sát Father Agent. Điểm chất lượng: ${refinedEval.score}/100. ${refinedEval.critique}`
    };
  }

  return {
    ...initial,
    supervisedIterations: 1,
    qualityScore: evalResult.score,
    supervisorNotes: `Đã qua kiểm duyệt Father Agent. Điểm chất lượng: ${evalResult.score}/100.`
  };
};
