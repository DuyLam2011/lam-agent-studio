import { ToolDecisionState, ToolStrategyType } from './decisionCenterTypes';
import { TOOL_STRATEGY_CONFIGS } from './toolOptimizationRules';

export const evaluateToolDecision = (
  prompt: string,
  context?: { activeFile?: string }
): ToolDecisionState => {
  const p = (prompt || '').trim().toLowerCase();

  let strategy: ToolStrategyType = 'DIRECT_RESPONSE';
  let confidence = 0.85;

  if (/sửa|fix|thay thế|chỉnh|patch|thêm dòng|đổi code|refactor|cập nhật file|optimize/i.test(p)) {
    strategy = 'SURGICAL_PATCH';
    confidence = 0.95;
  } else if (/test|verify|kiểm thử|git status|typecheck|bảo đảm tính toàn vẹn/i.test(p)) {
    strategy = 'VERIFICATION_RUN';
    confidence = 0.94;
  } else if (/tìm|search|đọc|ở đâu|xem|kiểm tra file|dòng nào|hàm|class|nằm ở|tra cứu/i.test(p)) {
    strategy = 'WORKSPACE_INSPECT';
    confidence = 0.92;
  } else if (/chạy lệnh|terminal|install|npm run|build|start dev|bash/i.test(p)) {
    strategy = 'ENVIRONMENT_ACTION';
    confidence = 0.90;
  }

  const targetScope = extractTargetFilePath(prompt, context?.activeFile);
  const config = TOOL_STRATEGY_CONFIGS[strategy];

  const tokenSavings = strategy === 'DIRECT_RESPONSE'
    ? 'Tiết kiệm ~90% token'
    : (strategy === 'SURGICAL_PATCH' ? 'Tiết kiệm ~80% token (Surgical Window)' : 'Tiết kiệm ~65% token');

  return {
    strategy,
    strategyTitle: config.title,
    strategyDescription: config.description,
    recommendedPipeline: config.defaultPipeline,
    prunedTools: config.disallowedTools,
    targetScope,
    confidence,
    tokenSavingsEstimate: tokenSavings,
    computedAt: Date.now(),
    rawPrompt: prompt
  };
};

const extractTargetFilePath = (prompt: string, fallbackFile?: string): string | undefined => {
  const match = prompt.match(/[a-zA-Z0-9_\-./\\]+\.(?:tsx|ts|jsx|js|json|html|css|md|py)/);
  if (match) return match[0];
  return fallbackFile ? fallbackFile.split(/[/\\]/).pop() : undefined;
};

export const formatDecisionCenterDirective = (decision: ToolDecisionState): string => {
  const lines: string[] = [
    `[DECISION CENTER: TOOL OPTIMIZATION DIRECTIVE]`,
    `- Chiến lược công cụ: ${decision.strategyTitle}`,
    `- Mô tả: ${decision.strategyDescription}`
  ];

  if (decision.targetScope) {
    lines.push(`- Tệp mục tiêu xác định: ${decision.targetScope}`);
  }

  if (decision.recommendedPipeline.length > 0) {
    lines.push(`- Chuỗi gọi tool tối ưu (Pipeline):`);
    decision.recommendedPipeline.forEach(step => {
      lines.push(`  ${step.step}. [${step.tool}] -> ${step.purpose} (${step.isMandatory ? 'Bắt buộc' : 'Khuyến nghị'})`);
    });
  } else {
    lines.push(`- Không gọi tool dư thừa. Trả lời trực tiếp, rõ ràng theo phong cách Executive-First.`);
  }

  if (decision.prunedTools.length > 0) {
    lines.push(`- Cấm gọi các công cụ dư thừa: ${decision.prunedTools.join(', ')}.`);
  }

  return lines.join('\n');
};
