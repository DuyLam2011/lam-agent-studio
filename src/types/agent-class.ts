export type AgentClassType = 'architecture' | 'planner' | 'executor' | 'analytic';

export interface AgentClassMeta {
  id: AgentClassType;
  name: string;
  displayName: string;
  badgeLabel: string;
  icon: string;
  themeColor: string;
  bgBadge: string;
  borderColor: string;
  description: string;
  targetCapabilities: string[];
  recommendedSkills: string[];
  defaultReasoningEffort: 'low' | 'medium' | 'high';
}

export const AGENT_CLASS_REGISTRY: Record<AgentClassType, AgentClassMeta> = {
  architecture: {
    id: 'architecture',
    name: 'Architecture',
    displayName: 'Architecture & Quality Guardian',
    badgeLabel: 'ARCHITECTURE',
    icon: 'Building2',
    themeColor: '#a855f7',
    bgBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    description: 'Chuyên rà soát kiến trúc, audit bảo mật (OWASP), kiểm tra modularity (<150 dòng), review code & thiết kế hạ tầng.',
    targetCapabilities: ['review', 'kiểm thử bảo mật', 'kiến trúc hệ thống', 'audit', 'hạ tầng', 'modularity'],
    recommendedSkills: ['code_review', 'security_audit', 'ui_ux_review', 'document_api'],
    defaultReasoningEffort: 'high'
  },
  planner: {
    id: 'planner',
    name: 'Planner',
    displayName: 'Strategic Decomposition Planner',
    badgeLabel: 'PLANNER',
    icon: 'Compass',
    themeColor: '#f59e0b',
    bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    description: 'Chuyên lên kế hoạch tổng thể, chia nhỏ bài toán thành các sub-task có hợp đồng rõ ràng, phân bổ tài nguyên & context budgeting.',
    targetCapabilities: ['lên plan', 'phân rã task', 'chiến lược', 'tối ưu hóa quy trình', 'context budgeting'],
    recommendedSkills: ['agent_management', 'idea_to_action', 'automation', 'optimize_codebase', 'daily_log'],
    defaultReasoningEffort: 'medium'
  },
  executor: {
    id: 'executor',
    name: 'Executor',
    displayName: 'Autonomous Code & Command Executor',
    badgeLabel: 'EXECUTOR',
    icon: 'Zap',
    themeColor: '#10b981',
    bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    description: 'Chuyên viết code, áp dụng surgical patches, chạy lệnh terminal Bash chuẩn xác, sửa lỗi runtime và chạy kiểm thử tự động.',
    targetCapabilities: ['viết code', 'chạy lệnh', 'vá lỗi', 'sửa runtime log', 'chạy test', 'thực thi script'],
    recommendedSkills: ['debug_issue', 'enhance_ui', 'create_launcher', 'caveman-commit', 'release_helper'],
    defaultReasoningEffort: 'low'
  },
  analytic: {
    id: 'analytic',
    name: 'Analytic',
    displayName: 'Analytical & Intelligence Specialist',
    badgeLabel: 'ANALYTIC',
    icon: 'LineChart',
    themeColor: '#06b6d4',
    bgBadge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    borderColor: 'border-cyan-500/40',
    description: 'Chuyên gia phân tích cấu trúc repo, bóc tách capabilities, tổng hợp skill và thiết kế bộ eval kiểm định bằng tiếng Anh.',
    targetCapabilities: ['repo scanning', 'pattern discovery', 'capability analysis', 'skill synthesis', 'eval engineering'],
    recommendedSkills: ['code_review', 'document_api', 'security_audit', 'optimize_codebase'],
    defaultReasoningEffort: 'high'
  }
};

export const getAgentClassMeta = (classType?: AgentClassType): AgentClassMeta => {
  return (classType && AGENT_CLASS_REGISTRY[classType]) || AGENT_CLASS_REGISTRY.executor;
};
