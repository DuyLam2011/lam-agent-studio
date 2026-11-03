import { AgentClassType } from '../../types/agent-class';
import { AgentCombo } from '../../types/agent-combo';
import { SubagentPersona } from '../../types/subagents';
import { SmartRoutingDecision } from '../benchmark/smartModelRouter';
import { ClarificationReport } from '../advisory/agentClarificationService';
import { buildComboFlowSystemPrompt } from '../combos/agentComboOrchestrator';

export interface BuildLeadRulesParams {
  wsId?: string;
  wsPath: string;
  targetClass: AgentClassType;
  fatherDirective: string;
  smartRoute: SmartRoutingDecision;
  classMismatchWarning?: any;
  activeCombo?: AgentCombo | null;
  bypassCombo?: boolean;
  subagents: SubagentPersona[];
  sensitiveWarning?: any;
  clarification?: ClarificationReport;
  toolDecisionDirective?: string;
  agent: any;
}

export const buildLeadRules = (params: BuildLeadRulesParams) => {
  const {
    wsId, wsPath, targetClass, fatherDirective, smartRoute,
    classMismatchWarning, activeCombo, bypassCombo, subagents,
    sensitiveWarning, clarification, toolDecisionDirective, agent
  } = params;

  const isComboActive = activeCombo && !bypassCombo;
  const baseRules = isComboActive
    ? [{
        id: `combo-${activeCombo.id}`,
        name: activeCombo.name,
        description: activeCombo.description,
        content: buildComboFlowSystemPrompt(activeCombo, subagents),
        scope: 'workspace' as const,
        source: 'custom' as const,
        active: true,
        updatedAt: Date.now()
      }, ...agent.getActiveRulesForContext(wsId, wsPath)]
    : agent.getActiveRulesForContext(wsId, wsPath);

  const routingRule = {
    id: 'smart-router-directive',
    name: 'Smart Router Directive',
    description: 'Dynamic Task Complexity Assessment & Output Standard',
    content: smartRoute.thinkingDirective,
    scope: 'workspace' as const,
    source: 'custom' as const,
    active: true,
    updatedAt: Date.now()
  };

  const fatherClassRule = {
    id: 'father-agent-class-directive',
    name: `Father Agent Directive [${targetClass.toUpperCase()}]`,
    description: `Class-based Father Agent Governance (${targetClass})`,
    content: fatherDirective,
    scope: 'workspace' as const,
    source: 'custom' as const,
    active: true,
    updatedAt: Date.now()
  };

  const mismatchRule = classMismatchWarning ? [{
    id: 'class-mismatch-directive',
    name: 'Class Mismatch Safeguard Directive',
    description: 'Enforces role boundary protection when agent class is misaligned with task',
    content: `[ROLE MISMATCH]: ${classMismatchWarning.warningText}. You MUST state this mismatch upfront and decline to perform direct mutations if you are a Planner!`,
    scope: 'workspace' as const,
    source: 'custom' as const,
    active: true,
    updatedAt: Date.now()
  }] : [];

  const sensitiveRule = sensitiveWarning ? [{
    id: 'sensitive-action-safeguard',
    name: 'Sensitive Action Safeguard Directive',
    description: 'Warns model of sensitive/high-risk action target',
    content: `[SENSITIVE ACTION NOTICE: ${sensitiveWarning.category.toUpperCase()}]: ${sensitiveWarning.warningNote}. You MUST explicitly outline all file mutations and verify invariants!`,
    scope: 'workspace' as const,
    source: 'custom' as const,
    active: true,
    updatedAt: Date.now()
  }] : [];

  const clarificationRule = clarification?.needsClarification ? [{
    id: 'clarification-directive',
    name: 'Clarification & Step Advisory Directive',
    description: 'Prompts agent to provide preliminary steps, risk assessment, and options before mutation',
    content: clarification.directiveMarkdown,
    scope: 'workspace' as const,
    source: 'custom' as const,
    active: true,
    updatedAt: Date.now()
  }] : [];

  const decisionCenterRule = toolDecisionDirective ? [{
    id: 'decision-center-tool-directive',
    name: 'Decision Center: Tool Application Directive',
    description: 'Enforces optimal tool application pipeline and blocks disallowed tools',
    content: toolDecisionDirective,
    scope: 'workspace' as const,
    source: 'custom' as const,
    active: true,
    updatedAt: Date.now()
  }] : [];

  return [...decisionCenterRule, ...sensitiveRule, ...clarificationRule, ...mismatchRule, fatherClassRule, routingRule, ...baseRules];
};
