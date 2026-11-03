import { ContextAttachment } from '../../store/useAgentStore';
import {
  TokenEstimationReport,
  ContextOptimizationAction
} from '../advisory/chatPromptOptimizerService';
import { matchSubagentsForPrompt } from '../subagents/subagentAdvisorMatcher';

export const calculateTokenBudget = (
  inputText: string,
  attachments: ContextAttachment[] = [],
  activeFileContent?: string,
  isConciseMode = false
): TokenEstimationReport => {
  const promptTokens = Math.max(1, Math.ceil((inputText || '').length / 3.8));

  let attachmentTokens = 0;
  let hasFolder = false;
  let hasGitDiff = false;

  for (const att of attachments) {
    if (att.tokenEstimate) {
      attachmentTokens += att.tokenEstimate;
    } else if (att.snippet) {
      attachmentTokens += Math.ceil(att.snippet.length / 3.8);
    } else {
      attachmentTokens += 500;
    }
    if (att.type === 'folder') hasFolder = true;
    if (att.type === 'diff' || att.path?.includes('git')) hasGitDiff = true;
  }

  const systemContextTokens = 1100;
  const totalTokens = promptTokens + attachmentTokens + systemContextTokens;
  const lower = (inputText || '').toLowerCase();
  const subagentRecs = matchSubagentsForPrompt(inputText);

  const actions: ContextOptimizationAction[] = [];
  let potentialSavingsTokens = 0;

  if (hasFolder) {
    const savings = Math.max(1200, Math.round(attachmentTokens * 0.72));
    actions.push({
      id: 'act-trim-folder',
      title: 'Trim Folder to Active File Only',
      description: `Folder attachments consume ~${attachmentTokens} tokens. Focus only on active file.`,
      estimatedSavingsTokens: savings,
      percentageSavings: 72,
      actionType: 'use_active_file_only'
    });
    potentialSavingsTokens += savings;
  }

  if (!hasGitDiff && (/diff|review|changes|git|status/i.test(lower) || attachments.length > 2)) {
    const savings = Math.max(600, Math.round(attachmentTokens * 0.65));
    actions.push({
      id: 'act-attach-git',
      title: 'Ground in @GitDiff instead of full files',
      description: 'Diff inspection consumes only ~400 tokens compared to multi-file payloads.',
      estimatedSavingsTokens: savings,
      percentageSavings: 65,
      actionType: 'attach_git'
    });
    if (!hasFolder) potentialSavingsTokens += savings;
  }

  if (!isConciseMode && (totalTokens > 1800 || lower.length > 80)) {
    const savings = Math.round(totalTokens * 0.35);
    actions.push({
      id: 'act-concise',
      title: 'Enable Concise Execution Mode',
      description: 'Trims verbose conversational responses to save ~60% output generation tokens.',
      estimatedSavingsTokens: savings,
      percentageSavings: 35,
      actionType: 'enable_concise_mode'
    });
    potentialSavingsTokens += savings;
  }

  if (activeFileContent && activeFileContent.length > 3000) {
    const savings = Math.round((activeFileContent.length / 3.8) * 0.60);
    actions.push({
      id: 'act-window-file',
      title: 'Window File to Target Region (100 Lines)',
      description: 'Reads only relevant functions rather than injecting monolithic source files.',
      estimatedSavingsTokens: savings,
      percentageSavings: 60,
      actionType: 'window_active_file'
    });
    potentialSavingsTokens += savings;
  }

  const potentialSavingsPercent = totalTokens > 0
    ? Math.min(85, Math.round((potentialSavingsTokens / totalTokens) * 100))
    : 0;

  return {
    promptTokens,
    attachmentTokens,
    systemContextTokens,
    totalTokens,
    potentialSavingsTokens,
    potentialSavingsPercent,
    recommendedActions: actions,
    recommendedSubagents: subagentRecs
  };
};
