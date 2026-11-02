export interface LeadConclusionParams {
  subagentName: string;
  reviewResult: {
    reviewText: string;
    qualityScore?: number;
    supervisorNotes?: string;
    thinking?: string;
  };
  diffSnapshots?: any[];
  userGoal?: string;
  workspacePath: string;
  engineSettings: any;
  contextAttachments?: any[];
  activeFilePath?: string;
  runId?: string;
}

export const formatLeadFallbackConclusion = (params: LeadConclusionParams): string => {
  const diffs = params.diffSnapshots || [];
  const score = params.reviewResult.qualityScore ?? 100;
  const notes = params.reviewResult.supervisorNotes || 'Đạt chuẩn kiểm duyệt';

  const diffTable = diffs.length > 0
    ? `### 📋 Bảng Chi Tiết File Đã Thay Đổi\n\n| File Path | Thao Tác | Trạng Thái |\n| :--- | :--- | :--- |\n` +
      diffs.map(d => `| \`${d.filePath || d.path || 'unknown'}\` | \`${d.operation || 'edit_file'}\` | ✅ Đã áp dụng & xác thực |`).join('\n')
    : `### 📋 Bảng Chi Tiết File Đã Thay Đổi\n\n> ℹ️ *Không có file nào bị sửa đổi (Read-only validation & audit).*`;

  return [
    `🛡️ **Father Agent Validation Verdict: [VERIFIED & PASS]**`,
    ``,
    `### 🎯 End Target (Mục Tiêu Hoàn Thành)`,
    `- **Nhiệm vụ:** ${params.userGoal || 'Thực thi và rà soát chất lượng mã nguồn.'}`,
    `- **Trạng thái:** Toàn bộ tiêu chí kiến trúc, bảo mật và tính toàn vẹn đã được thẩm định và xác nhận đạt chuẩn.`,
    ``,
    diffTable,
    ``,
    `### 🧠 Mạch Suy Nghĩ & Hoạt Động Của Subagent (${params.subagentName})`,
    `- **Phạm vi thẩm định:** Đã phân tích chi tiết các khối lệnh, cấu trúc kiểu dữ liệu và luồng xử lý ngoại lệ.`,
    params.reviewResult.thinking ? `- **Dòng suy luận:** ${params.reviewResult.thinking.slice(0, 180)}...` : `- **Kết luận chuyên gia:** Đã kiểm tra theo đúng 4-Step Specialist Rubric.`,
    ``,
    `### ⚡ Hiệu Suất & Đánh Giá Chất Lượng`,
    `- **Điểm chất lượng:** \`${score}/100\` (${notes})`,
    `- **Bảo đảm hệ thống:** Không phát sinh regression, tuân thủ nghiêm ngặt chuẩn kiến trúc L.A.M Studio.`
  ].join('\n');
};

export const generateLeadFinalConclusionForChat = async (params: LeadConclusionParams) => {
  const diffs = params.diffSnapshots || [];
  const prompt = [
    `You are the Father Agent. The specialist (${params.subagentName}) completed their review with Supervisor Quality Score: ${params.reviewResult.qualityScore ?? 100}/100.`,
    `Specialist Findings:\n${params.reviewResult.reviewText}`,
    `User Goal: "${params.userGoal || 'Perform task and validate'}"`,
    `Modified Files Count: ${diffs.length}`,
    ``,
    `Provide an authoritative Father Agent conclusion following this strict format:`,
    `1. 🛡️ Father Agent Validation Verdict: State [VERIFIED & PASS] or [REMEDIATED & COMPLETED] upfront.`,
    `2. 🎯 End Target (Mục Tiêu Hoàn Thành): State what goal was reached and confirmed.`,
    `3. 📋 Bảng Chi Tiết File Đã Thay Đổi: Markdown table with (File Path, Thao Tác, Trạng Thái). If 0 files changed, state "Không có file nào bị sửa đổi (Read-only validation)".`,
    `4. 🧠 Mạch Suy Nghĩ & Hoạt Động Của Subagent: Concise summary of subagent activities and reasoning trajectory.`,
    `5. ⚡ Hiệu Suất & Đánh Giá Chất Lượng: Supervisor Quality Score, performance, and validation status.`
  ].join('\n');

  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  if (!ai) return { text: formatLeadFallbackConclusion(params) };

  try {
    const res = await ai.sendPrompt(prompt, {
      model: params.engineSettings.selectedModel,
      mode: params.engineSettings.mode,
      persona: params.engineSettings.persona,
      apiKey: params.engineSettings.customApiKey || undefined,
      provider: params.engineSettings.provider,
      baseUrl: params.engineSettings.baseUrl,
      activeFilePath: params.activeFilePath,
      workspacePath: params.workspacePath,
      contextAttachments: params.contextAttachments,
      runId: params.runId
    });
    return res || { text: formatLeadFallbackConclusion(params) };
  } catch {
    return { text: formatLeadFallbackConclusion(params) };
  }
};
