import { SubagentPersona } from '../../types/subagents';
import { AgentClassType } from '../../types/agent-class';
import { resolveSubagentModel, ModelRoutingDecision } from '../subagents/subagentModelRouter';

export interface SubagentTaskContract {
  subagentId: string;
  subagentName: string;
  role: string;
  taskObjective: string;
  expectedContext: string;
  expectedResult: string;
  requiredClass: AgentClassType;
  routing: ModelRoutingDecision;
}

export interface LeadDelegationPlan {
  userGoal: string;
  contracts: SubagentTaskContract[];
  architecturalRationale: string;
}

export const detectDelegationTrigger = (text: string): boolean => {
  const vnRegex = /chia task|phân công|delegate|tự định tuyến|assign subagent|giao việc|subagent|điều phối|viết code|implement|tạo chức năng|sửa code|fix bug|refactor|xây dựng/i;
  const enRegex = /\b(add|create|build|integrate|integration|implement|implementation|delegate|delegation|subagent|assign|refactor|audit|review|api|endpoint|service|feature|database)\b/i;
  return vnRegex.test(text) || enRegex.test(text);
};

export const validateSubagentTaskDelegation = (
  contract: SubagentTaskContract,
  subagent: SubagentPersona
): { isValid: boolean; reason?: string } => {
  if (subagent.agentClass === 'planner' && /viết code|sửa code|patch|chạy lệnh|terminal|bash/i.test(contract.taskObjective)) {
    return { isValid: false, reason: 'Planner subagent cannot be delegated coding or bash execution tasks' };
  }
  if (subagent.agentClass === 'executor' && /lên plan|chiến lược|roadmap|context budget/i.test(contract.taskObjective)) {
    return { isValid: false, reason: 'Executor subagent cannot be delegated strategic roadmap planning tasks' };
  }
  return { isValid: true };
};

export const decomposeTaskWithRuleset = (
  userGoal: string,
  availableSubagents: SubagentPersona[],
  engineSettings: any
): LeadDelegationPlan => {
  const goal = userGoal.trim();
  const contracts: SubagentTaskContract[] = [];
  const hardwork = engineSettings?.hardworkLevel || 'deep';

  const addContract = (id: string, objective: string, context: string, result: string, requiredClass: AgentClassType) => {
    let sub = availableSubagents.find((s) => s.id === id || s.id.includes(id));
    if (!sub || (sub.agentClass && sub.agentClass !== requiredClass)) {
      sub = availableSubagents.find((s) => s.agentClass === requiredClass) || availableSubagents[0];
    }
    if (sub && !contracts.some((c) => c.subagentId === sub.id)) {
      contracts.push({
        subagentId: sub.id, subagentName: sub.name, role: sub.role,
        taskObjective: objective, expectedContext: context, expectedResult: result,
        requiredClass, routing: resolveSubagentModel(sub, `${objective} ${goal}`, engineSettings)
      });
    }
  };

  if (hardwork === 'max_swarm') {
    addContract('subagent-task-planner', 'Decompose objectives into phased milestones & dependency graph', 'User requirements & repo architecture', 'Milestone roadmap & task contracts', 'planner');
    addContract('subagent-security-harness', 'Scan OWASP vulnerabilities, credential leaks & sandbox policy', 'Active files & diffs', 'Security matrix report & defense boundaries', 'architecture');
    addContract('subagent-code-executor', 'Implement modular code (<150 lines) with zero placeholders', 'Target files & conventions', 'Complete, verified TypeScript code', 'executor');
    addContract('subagent-backend-reviewer', 'Comprehensive diff audit & evaluate Quality Score', 'Working tree changes & diffs', 'Architecture review verdict & quality score', 'architecture');
    addContract('subagent-qa-reviewer', 'Design sandbox verification scenarios & test suites', 'Logic contracts & test suites', 'Sandbox test execution & regression pass', 'executor');
  } else if (hardwork === 'deep') {
    addContract('subagent-task-planner', 'Analyze requirements & architectural contracts', 'User goal & file context', 'Implementation plan', 'planner');
    addContract('subagent-code-executor', 'Implement modular code (<150 lines) with zero placeholders', 'Target files & conventions', 'Modular implementation', 'executor');
    addContract('subagent-backend-reviewer', 'Review code quality & architectural standards', 'Working tree changes & diffs', 'Clean review verdict', 'architecture');
  } else if (hardwork === 'rapid') {
    addContract('subagent-code-executor', 'Direct modular code implementation (<150 lines)', 'Target files', 'Fast implementation', 'executor');
  } else {
    // balanced (2-agent pair engineering)
    const firstSub = /security|owasp|leak|vulnerab|auth|token|secret/i.test(goal) ? 'subagent-security-harness' : 'subagent-code-executor';
    addContract(firstSub, 'Implement modular logic (<150 lines) with zero placeholders', 'Target files & architecture rules', 'Modular implementation', firstSub === 'subagent-security-harness' ? 'architecture' : 'executor');
    addContract('subagent-backend-reviewer', 'Review implementation modularity and architecture standards', 'Working tree changes & diffs', 'Clean review verdict', 'architecture');
  }

  return {
    userGoal: goal, contracts,
    architecturalRationale: `Decomposed across ${contracts.length} subagents (Reasoning: ${hardwork.toUpperCase()}).`
  };
};
