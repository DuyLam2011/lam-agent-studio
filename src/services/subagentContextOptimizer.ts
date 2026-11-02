import { SubagentPersona } from '../types/subagents';
import { ModelRoutingDecision } from './subagentModelRouter';
import { resolveSpecializedPersonaLens } from './subagentPersonaLenses';
import { filterDiffsForPersona, filterAttachmentsForPersona, getMultiStepAnalysisInstructions } from './subagentAnalysisFramework';

export interface SubagentContextParams {
  workspacePath: string;
  subagentId?: string;
  diffSnapshots?: any[];
  toolCalls?: any[];
  activeFilePath?: string;
  activeFileContent?: string;
  contextAttachments?: any[];
  repoName?: string;
  repoTag?: string;
}

export const buildOptimizedSubagentContext = async (params: SubagentContextParams): Promise<string> => {
  const { diffSnapshots = [], toolCalls = [], workspacePath, activeFilePath, activeFileContent, contextAttachments = [], subagentId } = params;
  const sections: string[] = [];

  const relevantDiffs = filterDiffsForPersona(diffSnapshots, subagentId);
  if (relevantDiffs.length > 0) {
    const diffBlocks = relevantDiffs.map((d: any) => {
      const orig = d.originalContent ? d.originalContent.slice(0, 2000) : '(empty/new)';
      const next = d.newContent ? d.newContent.slice(0, 3000) : '(empty/deleted)';
      return `### 📄 File: ${d.relativePath} (+${d.linesAdded || 0}/-${d.linesRemoved || 0} lines)\n- Original:\n\`\`\`\n${orig}\n\`\`\`\n- Modified Content:\n\`\`\`\n${next}\n\`\`\``;
    });
    sections.push(`## 🔍 Active File Modifications & Diffs (${relevantDiffs.length} files):\n${diffBlocks.join('\n\n')}`.slice(0, 14000));
  }

  if (toolCalls.length > 0) {
    const toolSummary = toolCalls.slice(-8).map((tc: any) =>
      `- Tool: \`${tc.name}\` | Status: ${tc.status || 'success'} | Path: ${tc.args?.path || tc.args?.filePath || 'workspace'}`
    ).join('\n');
    sections.push(`## 🛠️ Recent Agent Tool Executions:\n${toolSummary}`);
  }

  if (relevantDiffs.length === 0 && typeof window !== 'undefined') {
    try {
      const git = (window as any).lamApi?.git;
      const gitDiff = await git?.diff?.(workspacePath);
      if (gitDiff?.success && gitDiff.data?.trim()) {
        sections.push(`## 🌿 Working Tree Git Diff:\n\`\`\`diff\n${gitDiff.data.slice(0, 8000)}\n\`\`\``);
      }
    } catch {}
  }

  if (activeFilePath) {
    const content = activeFileContent ? `\n\`\`\`\n${activeFileContent.slice(0, 6000)}\n\`\`\`` : ' (File path active in editor)';
    sections.push(`## 📝 Active Editor File: \`${activeFilePath}\`${content}`);
  }

  const relevantAttachments = filterAttachmentsForPersona(contextAttachments, subagentId);
  if (relevantAttachments.length > 0) {
    const attList = relevantAttachments.map((a) => {
      const preview = a.snippet ? `\n\`\`\`\n${a.snippet.slice(0, 2500)}\n\`\`\`` : '';
      return `- **[${a.name || a.path}]** (${a.type}${a.workspaceRepoTag ? `, ${a.workspaceRepoTag}` : ''})${preview}`;
    }).join('\n');
    sections.push(`## 📦 Attached Context Payloads (${relevantAttachments.length}):\n${attList}`.slice(0, 10000));
  }

  return sections.join('\n\n---\n\n') || '(Clean workspace environment. Inspecting repository root and directives.)';
};

export interface SubagentPromptAssemblyOptions {
  subagent: SubagentPersona;
  routing: ModelRoutingDecision;
  userGoal: string;
  codeContext: string;
  repoName?: string;
  repoTag?: string;
  repoRoot?: string;
  taskContract?: { objective?: string; expectedContext?: string; expectedResult?: string };
}

export const synthesizeSubagentPrompt = (opts: SubagentPromptAssemblyOptions): string => {
  const { subagent, routing, userGoal, codeContext, repoName, repoTag, repoRoot, taskContract } = opts;
  const personaLens = resolveSpecializedPersonaLens(subagent.id, subagent.role);
  const analysisRubric = getMultiStepAnalysisInstructions(subagent.id);

  return [
    `You are ${subagent.name}, acting as ${subagent.role} within L.A.M Agent Studio.`,
    `System Directives: ${subagent.systemPrompt}`,
    `[Model Routing: ${routing.modelName} (Tier: ${routing.tier.toUpperCase()}) | Reason: ${routing.routingReason}]`,
    repoName ? `[Target Repository Scope: ${repoName} (${repoTag || 'active'}) | Root: ${repoRoot || 'workspace'}]` : '',
    '',
    `### 🎯 Task Objective & Delegation Contract`,
    `- User Goal: "${userGoal}"`,
    taskContract?.objective ? `- Specific Subagent Objective: ${taskContract.objective}` : '',
    taskContract?.expectedContext ? `- Expected Context Focus: ${taskContract.expectedContext}` : '',
    taskContract?.expectedResult ? `- Expected Result Artifact: ${taskContract.expectedResult}` : '',
    '',
    analysisRubric,
    '',
    `### 🔬 Domain Specialist Checklist & Quality Invariants`,
    personaLens,
    '',
    `### 📑 Grounded Codebase Context`,
    codeContext,
    '',
    `### 📋 Output Format & Grounding Rules`,
    `1. 🛡️ Executive Assessment: State bottom-line verdict upfront.`,
    `2. 🔍 Detailed Findings: CITE SPECIFIC FILES, LINES, AND IDENTIFIERS. Never produce generic summaries without citations.`,
    `3. 🛠️ Actionable Remediation: Concrete patch recommendations if issues exist.`,
    `4. MANDATORY CONCLUSION: Conclude on the last line with strictly:`,
    `   "VERDICT: PASS" (if no regressions/vulnerabilities exist)`,
    `   or "VERDICT: CHANGES_REQUIRED" (if fixes are needed).`
  ].filter(Boolean).join('\n');
};
