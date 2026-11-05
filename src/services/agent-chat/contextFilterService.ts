import type { ChatMessage, ToolCallItem } from '../../store/useAgentStore';
import { AgentClassType } from '../../types/agent-class';
import { HistoryPayloadEntry, summarizeToolOutcomes } from './chatHistoryBuilder';

export type TargetAgentClass = AgentClassType | 'father' | 'scout' | 'reviewer' | 'architect' | 'engineer';

export interface ContextFilterOptions {
  activeFilePath?: string;
  activeFileContent?: string;
}

export interface FilteredRoleView {
  targetRole: TargetAgentClass;
  history: HistoryPayloadEntry[];
  latestFileContext?: string;
  distilledNotes: string[];
}

/** Detects if a tool is low-level exploratory scratchpad (e.g. grep, find, temp check) */
const isScratchpadTool = (tc: ToolCallItem): boolean =>
  /grep|search_files|list_workspace|find_file|glob/i.test(tc.name || '');

/** Distills a message text by removing raw tool logs and preserving conclusions */
const distillContent = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\[Executed [^\]]+\]:[^\n]*/gi, '')
    .replace(/\[File:[^\]]+\]\s*(?:\d+\s*\|\s*[^\n]*\n?)+/gi, '[File Line Range Inspected]')
    .trim();
};

/**
 * Filters the Master Session Log specifically for targetRole.
 * - Planner: Sees User Prompt + Analytic Final Conclusions (omits raw grep scratchpads).
 * - Engineer: Sees User Prompt + Final Plan + Latest File state (omits intermediate analytic chatter).
 * - Reviewer: Sees User Prompt + Final Plan + Engineer Patches/Diffs.
 */
export const buildViewForRole = (
  targetRole: TargetAgentClass,
  messages: ChatMessage[],
  options: ContextFilterOptions = {}
): FilteredRoleView => {
  const normalizedRole = targetRole === 'executor' ? 'engineer' : targetRole === 'architecture' ? 'architect' : targetRole;
  const filteredEntries: HistoryPayloadEntry[] = [];
  const distilledNotes: string[] = [];

  for (const msg of messages) {
    if (msg.role === 'system' || msg.status === 'streaming') continue;

    // 1. User Prompts: Universal across all agent views
    if (msg.role === 'user') {
      if (msg.text?.trim()) filteredEntries.push({ role: 'user', text: msg.text });
      continue;
    }

    const sender = (msg.agentRole || msg.agentId || '').toLowerCase();
    const isAnalytic = sender.includes('analytic') || sender.includes('scout');
    const isPlanner = sender.includes('planner');
    const isEngineer = sender.includes('engineer') || sender.includes('executor');
    const cleanText = distillContent(msg.text || '');

    // 2. Planner View Filter: User Prompt + Analytic Conclusions (strip grep scratchpads)
    if (normalizedRole === 'planner') {
      if (isAnalytic) {
        filteredEntries.push({ role: 'agent', text: `[ANALYTIC CONCLUSION]:\n${cleanText}` });
        distilledNotes.push('Included Analytic grounded conclusion (omitted raw grep scratchpads).');
      } else if (!isEngineer) {
        if (cleanText) filteredEntries.push({ role: 'agent', text: cleanText, toolSummary: summarizeToolOutcomes(msg) });
      }
      continue;
    }

    // 3. Engineer View Filter: User Prompt + Final Plan + Latest File (strip analytic scratchpads)
    if (normalizedRole === 'engineer') {
      if (isPlanner || sender.includes('architect')) {
        filteredEntries.push({ role: 'agent', text: `[FINAL PLAN / BLUEPRINT]:\n${cleanText}` });
        distilledNotes.push('Included Final Plan (omitted intermediate survey scratchpads).');
      } else if (isEngineer) {
        const patchSummary = (msg.diffSnapshots || []).map((d) => `Modified ${d.relativePath} (+${d.linesAdded}/-${d.linesRemoved})`).join('\n');
        filteredEntries.push({ role: 'agent', text: cleanText, toolSummary: patchSummary || undefined });
      } else if (!isAnalytic && cleanText) {
        filteredEntries.push({ role: 'agent', text: cleanText });
      }
      continue;
    }

    // 4. Reviewer View Filter: User Prompt + Plan + Engineer Patches/Diffs
    if (normalizedRole === 'reviewer') {
      if (isPlanner || sender.includes('architect')) {
        filteredEntries.push({ role: 'agent', text: `[APPROVED PLAN]:\n${cleanText}` });
      } else if (isEngineer) {
        const diffs = (msg.diffSnapshots || []).map((d) => `Patch: ${d.relativePath} (+${d.linesAdded}/-${d.linesRemoved})\n${d.newContent ? d.newContent.slice(0, 300) : ''}`).join('\n');
        filteredEntries.push({ role: 'agent', text: cleanText, toolSummary: diffs || summarizeToolOutcomes(msg) });
      }
      continue;
    }

    // 5. Default / Father Agent View: Clean distilled turns with sanitized tool summaries
    const nonScratchpadTools = (msg.toolCalls || []).filter((tc) => !isScratchpadTool(tc));
    const summary = nonScratchpadTools.length > 0 ? summarizeToolOutcomes({ ...msg, toolCalls: nonScratchpadTools }) : undefined;
    if (cleanText) filteredEntries.push({ role: 'agent', text: cleanText, toolSummary: summary });
  }

  // Inject Latest File Context if relevant for Engineer
  let latestFileContext: string | undefined;
  if (normalizedRole === 'engineer' && options.activeFilePath && options.activeFileContent) {
    latestFileContext = `[NỘI DUNG FILE MỚI NHẤT (${options.activeFilePath})]:\n${options.activeFileContent.slice(0, 1500)}`;
    distilledNotes.push(`Attached active file context for ${options.activeFilePath}.`);
  }

  return { targetRole, history: filteredEntries.slice(-25), latestFileContext, distilledNotes };
};
