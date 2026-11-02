import { AgentClassType } from '../types/agent-class';
import { resolveAgentClassForTask } from './agentClassRouter';

export interface ClassMismatchWarning {
  hasMismatch: boolean;
  assignedClass: AgentClassType;
  requiredClass: AgentClassType;
  agentNameOrRole: string;
  reason: string;
  warningText: string;
  suggestedAction: string;
  suggestedAgentId: string;
}

interface DetectMismatchParams {
  activeAgentClass?: AgentClassType | 'auto';
  persona?: string;
  taggedSubagentId?: string | null;
  userPrompt: string;
}

const resolveAssignedClass = (
  activeAgentClass?: AgentClassType | 'auto',
  persona?: string,
  taggedId?: string | null
): AgentClassType | null => {
  if (taggedId) {
    if (taggedId.includes('planner') || taggedId.includes('mcp')) return 'planner';
    if (taggedId.includes('code') || taggedId.includes('log') || taggedId.includes('qa')) return 'executor';
    if (taggedId.includes('reviewer') || taggedId.includes('security') || taggedId.includes('ui') || taggedId.includes('browser')) return 'architecture';
  }
  if (activeAgentClass && activeAgentClass !== 'auto') {
    return activeAgentClass;
  }
  if (persona) {
    const p = persona.toLowerCase();
    if (p.includes('planner') || p.includes('strategist')) return 'planner';
    if (p.includes('vibecoder') || p.includes('executor') || p.includes('terminal')) return 'executor';
    if (p.includes('reviewer') || p.includes('architect') || p.includes('security') || p.includes('inspector')) return 'architecture';
  }
  return null;
};

export const detectAgentClassMismatch = (params: DetectMismatchParams): ClassMismatchWarning | null => {
  const { activeAgentClass, persona, taggedSubagentId, userPrompt } = params;
  const assigned = resolveAssignedClass(activeAgentClass, persona, taggedSubagentId);
  if (!assigned) return null; // 'auto' mode or unassigned: Father Agent will auto-route cleanly

  const required = resolveAgentClassForTask(userPrompt);
  if (assigned === required) return null;

  const agentLabel = taggedSubagentId || persona || `Class [${assigned.toUpperCase()}]`;

  if (assigned === 'planner' && required === 'executor') {
    return {
      hasMismatch: true,
      assignedClass: 'planner',
      requiredClass: 'executor',
      agentNameOrRole: agentLabel,
      reason: 'Agent thuộc nhóm Planner được gọi để viết mã trực tiếp hoặc chạy lệnh terminal.',
      warningText: `⚠️ CẢNH BÁO LỆCH VAI TRÒ (CLASS MISMATCH): Agent ${agentLabel} thuộc Class [Planner] (chuyên lập kế hoạch & phân rã task), không được tối ưu để viết code trực tiếp hoặc chạy lệnh terminal. Hãy chuyển sang Class [Executor] (hoặc để Father Agent tự động điều phối) để tránh hallucination và sinh mã lỗi!`,
      suggestedAction: 'Chuyển sang Executor Class (subagent-code-executor)',
      suggestedAgentId: 'subagent-code-executor'
    };
  }

  if (assigned === 'executor' && required === 'planner') {
    return {
      hasMismatch: true,
      assignedClass: 'executor',
      requiredClass: 'planner',
      agentNameOrRole: agentLabel,
      reason: 'Agent thuộc nhóm Executor được yêu cầu hoạch định chiến lược hoặc phân rã task.',
      warningText: `⚠️ CẢNH BÁO LỆCH VAI TRÒ (CLASS MISMATCH): Agent ${agentLabel} thuộc Class [Executor] (chuyên viết mã & thực thi), không được tối ưu cho việc hoạch định chiến lược dài hạn hoặc phân bổ context window. Khuyến nghị chuyển sang Class [Planner] (subagent-task-planner).`,
      suggestedAction: 'Chuyển sang Planner Class (subagent-task-planner)',
      suggestedAgentId: 'subagent-task-planner'
    };
  }

  if (assigned === 'planner' && required === 'architecture') {
    return {
      hasMismatch: true,
      assignedClass: 'planner',
      requiredClass: 'architecture',
      agentNameOrRole: agentLabel,
      reason: 'Agent thuộc nhóm Planner được yêu cầu thực hiện audit bảo mật hoặc rà soát kiến trúc.',
      warningText: `⚠️ CẢNH BÁO LỆCH VAI TRÒ (CLASS MISMATCH): Agent ${agentLabel} thuộc Class [Planner] không chuyên sâu về audit an ninh OWASP hay modularity. Khuyến nghị chuyển sang Class [Architecture] (subagent-security-harness hoặc subagent-backend-reviewer).`,
      suggestedAction: 'Chuyển sang Architecture Class (subagent-security-harness)',
      suggestedAgentId: 'subagent-security-harness'
    };
  }

  return null;
};
