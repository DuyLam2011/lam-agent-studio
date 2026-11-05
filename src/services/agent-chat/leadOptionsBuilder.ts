import { useAgentStore } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { detectTaggedSubagent } from '../advisory/agentChatCollaborationService';
import { resolveActiveRepoScope } from '../workspace/activeRepoScopeResolver';
import { generateAdvisoryReport } from '../advisory/agentAdvisoryService';
import { resolveSmartModelRoute } from '../benchmark/smartModelRouter';
import { resolveAgentClassForTask, getFatherAgentDirective } from '../agent-classes/agentClassRouter';
import { detectAgentClassMismatch } from '../agent-classes/agentClassMismatchDetector';
import { analyzeClarificationNeeds } from '../advisory/agentClarificationService';
import { formatDecisionCenterDirective } from '../decision-center/decisionCenterService';
import { buildLeadRules } from './leadRulesBuilder';
import { HistoryPayloadEntry } from './chatHistoryBuilder';

export const sendPromptSafely = async (text: string, options: Record<string, unknown>): Promise<any> => {
  const ai = typeof window !== 'undefined' ? window.lamApi?.ai : undefined;
  if (!ai?.sendPrompt) return { status: 'failed', text: '⚠️ Agent engine is unavailable outside the desktop app.' };
  try {
    return await ai.sendPrompt(text, options);
  } catch (err: any) {
    return { status: 'failed', text: `⚠️ **Agent Execution Notice**: ${err?.message || 'Failed to reach the agent engine.'}` };
  }
};

export const buildLeadOptions = (text: string, history: HistoryPayloadEntry[]) => {
  const agent = useAgentStore.getState();
  const { securityMode } = useConversationStore.getState();
  const { systemContext, engineSettings, activeFile, contextAttachments, activeSkillIdsForChat } = agent;
  const repoScope = resolveActiveRepoScope({
    workspaces: systemContext.workspaces,
    activeWorkspaceId: systemContext.activeWorkspaceId,
    contextAttachments,
    activeFilePath: activeFile?.path,
    promptText: text,
    activeRepoPath: agent.activeRepoPath,
    fallbackCwd: systemContext.cwd
  });
  const wsPath = repoScope.repoRoot;
  const wsId = systemContext.activeWorkspaceId || undefined;
  const allSkills = agent.getActiveSkillsForContext(wsId, wsPath);
  const skills = activeSkillIdsForChat.length > 0
    ? allSkills.filter((s) => activeSkillIdsForChat.includes(s.name) || activeSkillIdsForChat.includes(s.id) || (s.folderName && activeSkillIdsForChat.includes(s.folderName)))
    : allSkills;
  const subagents = agent.getActiveSubagentsForContext(wsId, wsPath);
  const activeCombo = agent.getActiveCombo();
  const advisory = generateAdvisoryReport(text, skills, activeCombo);

  const smartRoute = resolveSmartModelRoute({
    userPrompt: text,
    contextAttachments,
    activeFilePath: activeFile?.path,
    engineSettings
  });

  const taggedSubagentId = detectTaggedSubagent(text);
  const classMismatchWarning = detectAgentClassMismatch({
    activeAgentClass: agent.activeAgentClass,
    persona: engineSettings.persona,
    taggedSubagentId,
    userPrompt: text
  });

  const explicitClass = agent.activeAgentClass !== 'auto' ? agent.activeAgentClass : undefined;
  const targetClass = explicitClass || resolveAgentClassForTask(text);
  const classSubagents = subagents.filter((s) => s.agentClass === targetClass);
  const fatherDirective = getFatherAgentDirective(targetClass, classSubagents.length);

  const clarification = analyzeClarificationNeeds(text, smartRoute.complexity, history);
  const toolDecisionDirective = agent.toolDecisionState
    ? formatDecisionCenterDirective(agent.toolDecisionState)
    : undefined;

  const rules = buildLeadRules({
    wsId,
    wsPath,
    targetClass,
    fatherDirective,
    smartRoute,
    classMismatchWarning,
    activeCombo,
    bypassCombo: advisory.comboRelevance.bypassCombo,
    subagents,
    sensitiveWarning: advisory.sensitiveWarning,
    clarification,
    toolDecisionDirective,
    agent
  });

  const prunedNames = (advisory.prunedSkills || []).map((p) => p.name);
  const activeFilteredSkills = skills.filter((s) => !prunedNames.includes(s.name));

  return {
    wsPath,
    repoScope,
    advisory,
    subagents,
    activeCombo,
    smartRoute,
    targetClass,
    fatherDirective,
    classMismatchWarning,
    clarification,
    activeSkillsList: activeFilteredSkills.map((s) => s.name || s.id),
    appliedRulesList: rules.map((r) => r.name || r.id),
    taggedSubagentId,
    options: {
      model: smartRoute.modelId, mode: engineSettings.mode, persona: engineSettings.persona,
      communicationTone: engineSettings.communicationTone, explanationVerbosity: engineSettings.explanationVerbosity,
      autonomyLevel: securityMode === 'turbo' ? 'autonomous' : (securityMode === 'restricted' ? 'ask-all' : 'balanced'),
      securityMode, apiKey: engineSettings.customApiKey, provider: engineSettings.provider, baseUrl: engineSettings.baseUrl,
      temperature: smartRoute.temperature, maxOutputTokens: engineSettings.maxTokens,
      reasoningEffort: smartRoute.reasoningEffort,
      activeFilePath: activeFile?.path, workspacePath: wsPath, contextAttachments, history,
      activeRepo: {
        name: repoScope.repoName,
        root: repoScope.repoRoot,
        tag: repoScope.tag,
        isMultiRepo: repoScope.isMultiRepo,
        availableRepos: repoScope.availableRepos.map((r) => ({ name: r.name, root: r.root, tag: r.tag }))
      },
      advisory,
      clarification,
      rules,
      skills: activeFilteredSkills,
      workflows: agent.getActiveWorkflowsForContext(wsId, wsPath),
      plugins: agent.getActivePluginsForContext(wsId, wsPath),
      subagents,
      memories: agent.getActiveMemoriesForContext(wsId, wsPath)
    }
  };
};
