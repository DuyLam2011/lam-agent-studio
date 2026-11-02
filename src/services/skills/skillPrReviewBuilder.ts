import { SkillDiffAnalysis, SkillEvalReport } from '../../types/skill-eval';

export const buildSkillPrReviewMarkdown = (
  diffAnalysis: SkillDiffAnalysis,
  evalReport?: SkillEvalReport
): string => {
  const verdictBanner = diffAnalysis.verdict === 'APPROVED'
    ? `🛡️ **Skill PR Analysis Verdict: [APPROVED - MERGE SAFE]**`
    : diffAnalysis.verdict === 'REQUIRES_CHANGES'
      ? `⚠️ **Skill PR Analysis Verdict: [REQUIRES CHANGES]**`
      : `🛑 **Skill PR Analysis Verdict: [BLOCKED - REGRESSION DETECTED]**`;

  const anomalyLines = diffAnalysis.anomalies.length > 0
    ? diffAnalysis.anomalies.map(a => `- **[${a.severity.toUpperCase()}]** ${a.message}`).join('\n')
    : `- ✅ Không phát hiện bất kỳ suy thoái (regression) nào về cú pháp, từ khóa kích hoạt hoặc kiểm soát an toàn.`;

  let evalSection = '';
  if (evalReport) {
    const tableRows = evalReport.results.map(r =>
      `| \`${r.testCaseId}\` | ${r.name} | ${r.passed ? '✅ PASS' : '❌ FAIL'} | \`${r.score}/100\` | ~${r.tokensConsumed} |`
    ).join('\n');

    evalSection = [
      `### 🧪 Kết Quả Chạy Eval Test Suite (${evalReport.passRate}% Pass Rate)`,
      `| Test ID | Tên Kịch Bản Kiểm Thử | Trạng Thái | Điểm | Token |`,
      `| :--- | :--- | :--- | :--- | :--- |`,
      tableRows,
      ``,
      `> ⚡ *Tổng kết Eval: ${evalReport.passedCount}/${evalReport.totalTests} passed | Điểm TB: ${evalReport.averageScore}/100 | Tiêu thụ: ~${evalReport.totalTokens} tokens.*`
    ].join('\n');
  }

  return [
    verdictBanner,
    ``,
    `### 📑 Tổng Quan Thay Đổi (Scope & Diff Metrics)`,
    `- **Skill Mục Tiêu:** \`${diffAnalysis.newName}\` (${diffAnalysis.oldName !== diffAnalysis.newName ? `Đổi tên từ \`${diffAnalysis.oldName}\`` : 'Bản cập nhật'})`,
    `- **Biến Động Dòng:** +${diffAnalysis.linesAdded} / -${diffAnalysis.linesRemoved} dòng | **Độ Dài:** ${diffAnalysis.wordCountDelta >= 0 ? `+${diffAnalysis.wordCountDelta}` : diffAnalysis.wordCountDelta} từ`,
    `- **Tác Động Token Context:** ${diffAnalysis.tokenCountDelta >= 0 ? `+${diffAnalysis.tokenCountDelta}` : diffAnalysis.tokenCountDelta} tokens (~${Math.abs(diffAnalysis.tokenCountDelta)} tokens ${diffAnalysis.tokenCountDelta <= 0 ? 'tiết kiệm' : 'tăng thêm'})`,
    ``,
    `### 🔍 Kiểm Định Bất Biến & An Toàn (Invariants & Safety Scan)`,
    anomalyLines,
    ``,
    evalSection,
    ``,
    `### 📋 Kết Luận & Hướng Xử Lý`,
    `- ${diffAnalysis.summary}`,
    `- ${diffAnalysis.isMergeSafe ? 'Được phép đồng bộ vào `.agents/skills/` hoặc merge vào nhánh chính.' : 'Yêu cầu khắc phục các vi phạm nêu trên trước khi tiến hành đồng bộ.'}`
  ].filter(Boolean).join('\n');
};
