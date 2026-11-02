import { generateSubagentReviewForChat, SubagentReviewParams, SubagentReviewResult } from './agentSubagentReviewService';

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

export const evaluateSubagentOutputQuality = (reviewText: string): QualityEvaluation => {
  const missingAspects: string[] = [];
  let score = 50;

  if (!reviewText || reviewText.trim().length < 80) {
    missingAspects.push('Nội dung quá ngắn, thiếu bằng chứng phân tích');
    score -= 30;
  }

  const hasCitations = /(?:\.ts|\.tsx|\.js|\.json|\.md|line\s*\d+|dòng\s*\d+|function|class|api|component|diff)/i.test(reviewText);
  if (hasCitations) {
    score += 25;
  } else {
    missingAspects.push('Thiếu tham chiếu cụ thể đến tệp tin, dòng code hoặc ngữ cảnh thực tế');
  }

  const hasVerdict = /(?:VERDICT|PASS|CHANGES_REQUIRED|kết luận|đánh giá|đạt chuẩn|hoàn thành|rủi ro|lỗi)/i.test(reviewText);
  if (hasVerdict) {
    score += 25;
  } else {
    missingAspects.push('Thiếu kết luận hoặc tiêu chí thẩm định rõ ràng');
  }

  const isAdequate = score >= 60 && missingAspects.length === 0;
  const critique = isAdequate
    ? 'Kết quả đạt tiêu chuẩn đánh giá và đầy đủ ngữ cảnh.'
    : `Cần bổ sung: ${missingAspects.join('; ')}.`;

  return { isAdequate, score: Math.max(0, Math.min(100, score)), missingAspects, critique };
};

export const executeSupervisedSubagent = async (
  params: SubagentReviewParams,
  onFeedbackNotice?: (note: string) => Promise<void> | void
): Promise<SupervisedExecutionResult> => {
  let initial = await generateSubagentReviewForChat(params);
  let evalResult = evaluateSubagentOutputQuality(initial.reviewText);

  // If subagent result is inadequate and was not cancelled, Father Agent chats back to request deep context
  if (!evalResult.isAdequate && initial.status !== 'cancelled') {
    const notice = `🔄 **[Father Agent Supervision]**: Phân tích từ **${initial.subagentName}** chưa đạt chuẩn context (${evalResult.missingAspects.join(', ')}). Đang yêu cầu Subagent rà soát và đào sâu context...`;
    await onFeedbackNotice?.(notice);

    const supervisorPrompt = `${params.userGoal || ''}\n\n[Father Agent Supervisor Critique]: Your previous output was evaluated as lacking context: ${evalResult.critique}. You MUST cite specific code files, functions, lines, and provide a concrete analysis with actionable verdict.`;

    const refined = await generateSubagentReviewForChat({
      ...params,
      userGoal: supervisorPrompt
    });

    const refinedEval = evaluateSubagentOutputQuality(refined.reviewText);
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
