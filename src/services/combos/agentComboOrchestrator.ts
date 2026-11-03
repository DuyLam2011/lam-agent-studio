import { AgentCombo, AgentComboStep } from '../../types/agent-combo';
import { SubagentPersona } from '../../types/subagents';
import { standardBuiltinSubagents } from '../../data/defaultSubagents';

export const buildComboFlowSystemPrompt = (
  combo: AgentCombo,
  subagents: SubagentPersona[] = standardBuiltinSubagents
): string => {
  const memberMap = new Map<string, SubagentPersona>();
  for (const s of subagents) memberMap.set(s.id, s);

  const teamList = combo.subagentIds.map((id, index) => {
    const s = memberMap.get(id);
    const step = combo.steps.find((st) => st.subagentId === id);
    const title = s ? `${s.name} (@${s.id.replace('subagent-', '')})` : id;
    const stepDesc = step ? ` - ${step.stepName}: ${step.objective}` : '';
    return `${index + 1}. ${title}${stepDesc}`;
  }).join('\n');

  return `
### ⚡ ACTIVE AGENT COMBO: ${combo.name}
- Flow Architecture: ${combo.flowType.toUpperCase()}
- Description: ${combo.description}
- Scope Assignment: ${combo.scope.toUpperCase()}${combo.targetScopeFormatted ? ` ${combo.targetScopeFormatted}` : ''}
- Recommended Skills: ${combo.recommendedSkills.join(', ')}

#### 👥 Designated Ensemble Team & Pipeline Steps:
${teamList}

#### 🔄 Coordination Standard:
1. Father Agent Orchestration: Coordinate with the active combo team according to the ${combo.flowType} pipeline.
2. Grounded Reviews: Each subagent audits their designated layer (UI/DOM, API/DB, OWASP Security, or QA Gate).
3. Surgical Remediation: Father Agent synthesizes all findings and produces clean, atomic patches adhering to Rule 3 (<150 lines per file).
`.trim();
};

export const detectComboTrigger = (text: string): boolean => {
  if (!text) return false;
  return /@combo|\/combo|chạy combo|run combo|agent combo|đội ngũ combo/i.test(text);
};

export const formatComboStepSummary = (
  step: AgentComboStep,
  subagentName: string,
  findings: string
): string => {
  return `#### 🛡️ Step: ${step.stepName} (${subagentName})\n**Objective**: ${step.objective}\n\n${findings}`;
};
