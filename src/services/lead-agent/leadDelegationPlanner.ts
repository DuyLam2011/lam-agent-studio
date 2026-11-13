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

export const detectDelegationTrigger = (text: string): boolean =>
  /chia task|phân công|delegate|tự định tuyến|assign subagent|giao việc|subagent|điều phối|viết code|implement|tạo chức năng|sửa code|fix bug|refactor|xây dựng/i.test(text);

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
    addContract('subagent-task-planner', 'Phân rã mục tiêu thành các milestone & dependency graph', 'Yêu cầu người dùng & kiến trúc repo', 'Kế hoạch milestone & hợp đồng nhiệm vụ', 'planner');
    addContract('subagent-security-harness', 'Rà soát lỗ hổng OWASP, rò rỉ secrets & chính sách sandbox', 'Active files & diffs', 'Báo cáo ma trận bảo mật & ranh giới', 'architecture');
    addContract('subagent-code-executor', 'Triển khai mã nguồn modular (<150 dòng) không placeholder', 'Files mục tiêu & quy chuẩn', 'Mã nguồn TypeScript hoàn chỉnh', 'executor');
    addContract('subagent-backend-reviewer', 'Đánh giá chất lượng toàn diện, diff audit & tính Quality Score', 'Working tree changes & diffs', 'Kết luận thẩm định & điểm chất lượng', 'architecture');
    addContract('subagent-qa-reviewer', 'Thiết kế kịch bản sandbox test & xác minh tính toàn vẹn', 'Hợp đồng logic & test suite', 'Kiểm thử sandbox & xác nhận không hồi quy', 'executor');
  } else if (hardwork === 'rapid') {
    addContract('subagent-code-executor', 'Triển khai mã nguồn trực tiếp (<150 dòng)', 'Files mục tiêu', 'Triển khai nhanh', 'executor');
  } else if (/plan|chiến lược|roadmap|kế hoạch|phân rã|decompose/i.test(goal)) {
    addContract('subagent-task-planner', 'Decompose objectives into phased milestones with clear contracts', 'User requirements & repo architecture', 'Structured execution roadmap with subagent contracts', 'planner');
    addContract('subagent-qa-reviewer', 'Define acceptance criteria & regression verification gates', 'Roadmap steps & test suites', 'Verification checklist & validation criteria', 'executor');
  } else if (/security|owasp|leak|vulnerab|auth|token|secret/i.test(goal)) {
    addContract('subagent-security-harness', 'Scan for OWASP vulnerabilities & credential leaks', 'Active files & diffs', 'Vulnerability matrix & remediation plan', 'architecture');
    addContract('subagent-backend-reviewer', 'Audit backend authorization and input validation boundaries', 'Backend routes & controllers', 'Strict parameter validation patches', 'architecture');
  } else if (/ui|ux|component|dom|style|tailwind|css|browser|preview/i.test(goal)) {
    addContract('subagent-ui-inspector', 'Audit design tokens, color contrast & theme compliance', 'React JSX & Tailwind classes', 'Theme token fixes & WCAG AA compliance', 'architecture');
    addContract('subagent-browser-inspector', 'Inspect rendered DOM bounding box & layout boundaries', 'Rendered DOM preview', 'DOM tree alignment & styling patches', 'architecture');
  } else if (/test|qa|regression|assert|spec|verify/i.test(goal)) {
    addContract('subagent-qa-reviewer', 'Design test coverage & anti-regression assertions', 'Target logic & test suites', 'New unit test cases & invariant checks', 'executor');
    addContract('subagent-backend-reviewer', 'Audit core implementation logic for edge-case failures', 'Core functions & error handlers', 'Hardened error handling blocks', 'architecture');
  } else if (hardwork === 'deep') {
    addContract('subagent-task-planner', 'Phân tích yêu cầu & hợp đồng kiến trúc', 'User goal & file context', 'Kế hoạch triển khai', 'planner');
    addContract('subagent-code-executor', 'Triển khai mã nguồn modular (<150 dòng)', 'Files mục tiêu & rules', 'Mã nguồn modular', 'executor');
    addContract('subagent-backend-reviewer', 'Review chất lượng mã nguồn & chuẩn kiến trúc', 'Changes & diffs', 'Clean review verdict', 'architecture');
  } else {
    addContract('subagent-code-executor', 'Implement modular logic (<150 lines) with zero placeholders', 'Target files & architecture rules', 'Modular, strictly-typed implementation', 'executor');
    addContract('subagent-backend-reviewer', 'Review implementation modularity and architecture standards', 'Working tree changes & diffs', 'Clean review verdict', 'architecture');
  }

  return {
    userGoal: goal, contracts,
    architecturalRationale: `Phân rã thành ${contracts.length} subagents (Độ Hardwork: ${hardwork.toUpperCase()}).`
  };
};
