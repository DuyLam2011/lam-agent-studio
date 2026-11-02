import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SkillEvalReport } from '../../../../types/skill-eval';
import { analyzeSkillModificationDiff } from '../../../../services/skills/skillDiffAnalyzer';
import { buildSkillPrReviewMarkdown } from '../../../../services/skills/skillPrReviewBuilder';
import clsx from 'clsx';

interface SkillPrDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldContent: string;
  newContent: string;
  skillName: string;
  evalReport?: SkillEvalReport | null;
}

export const SkillPrDiffModal: React.FC<SkillPrDiffModalProps> = ({
  isOpen, onClose, oldContent, newContent, skillName, evalReport
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const analysis = analyzeSkillModificationDiff(oldContent, newContent, skillName);
  const markdown = buildSkillPrReviewMarkdown(analysis, evalReport || undefined);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isApproved = analysis.verdict === 'APPROVED';
  const isBlocked = analysis.verdict === 'BLOCKED';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="surface-modal w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden text-xs shadow-2xl relative">
        <div className="p-3.5 border-b border-subtle surface-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={clsx("p-1.5 rounded-lg border", isApproved ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : isBlocked ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30")}>
              {isApproved ? <ShieldCheck size={16} /> : isBlocked ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
            </div>
            <div>
              <h3 className="font-bold text-app-text text-sm">Phân Tích PR & Biến Động Skill: {skillName}</h3>
              <p className="text-[11px] text-muted">Kiểm định hồi quy, Frontmatter trigger & Invariants an toàn</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div className={clsx("p-3 rounded-xl border flex items-center justify-between", isApproved ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" : isBlocked ? "bg-rose-500/10 border-rose-500/25 text-rose-300" : "bg-amber-500/10 border-amber-500/25 text-amber-300")}>
            <div className="flex items-center gap-2 font-semibold">
              <span>{isApproved ? '🛡️ PR VERDICT: [APPROVED - MERGE SAFE]' : isBlocked ? '🛑 PR VERDICT: [BLOCKED - REGRESSION DETECTED]' : '⚠️ PR VERDICT: [REQUIRES CHANGES]'}</span>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold">{analysis.summary}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl surface-card border border-subtle">
              <span className="text-[10px] text-muted block mb-0.5">Biến Động Dòng</span>
              <span className="font-mono font-bold text-app-text">+{analysis.linesAdded} / -{analysis.linesRemoved}</span>
            </div>
            <div className="p-2.5 rounded-xl surface-card border border-subtle">
              <span className="text-[10px] text-muted block mb-0.5">Delta Từ / Token</span>
              <span className="font-mono font-bold text-app-text">{analysis.wordCountDelta >= 0 ? `+${analysis.wordCountDelta}` : analysis.wordCountDelta} từ ({analysis.tokenCountDelta >= 0 ? `+${analysis.tokenCountDelta}` : analysis.tokenCountDelta}t)</span>
            </div>
            <div className="p-2.5 rounded-xl surface-card border border-subtle">
              <span className="text-[10px] text-muted block mb-0.5">Eval Test Suite</span>
              <span className="font-mono font-bold text-app-text">{evalReport ? `${evalReport.passRate}% Pass (${evalReport.passedCount}/${evalReport.totalTests})` : 'Chưa chạy eval'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-app-text uppercase tracking-wider block">Bất Biến & Dị Thường Phát Hiện (Invariants Scan)</span>
            {analysis.anomalies.length === 0 ? (
              <div className="p-3 rounded-xl surface-card border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={14} />
                <span>Không phát hiện dị thường nào. Toàn bộ Trigger & Quy tắc kiểm định được bảo toàn!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {analysis.anomalies.map((anom, idx) => (
                  <div key={idx} className={clsx("p-2.5 rounded-xl border flex items-start gap-2", anom.severity === 'breaking' ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300")}>
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded font-bold border border-current">{anom.type}</span>
                        <span className="font-semibold text-[11px]">{anom.severity.toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-snug">{anom.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {evalReport && (
            <div className="space-y-1.5 pt-2 border-t border-subtle">
              <span className="text-[10px] font-semibold text-app-text uppercase tracking-wider block">Bảng Chi Tiết Kịch Bản Eval Test Case</span>
              <div className="surface-card rounded-xl border border-subtle overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="surface-header border-b border-subtle text-[10px] text-muted">
                    <tr><th className="p-2">ID</th><th className="p-2">Tên Kịch Bản</th><th className="p-2">Kết Quả</th><th className="p-2">Điểm</th><th className="p-2">Tokens</th></tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {evalReport.results.map(r => (
                      <tr key={r.testCaseId}>
                        <td className="p-2 font-mono text-[10px] text-primary">{r.testCaseId}</td>
                        <td className="p-2 text-app-text font-medium">{r.name}</td>
                        <td className="p-2"><span className={clsx("font-bold text-[10px]", r.passed ? "text-emerald-400" : "text-rose-400")}>{r.passed ? 'PASS' : 'FAIL'}</span></td>
                        <td className="p-2 font-mono text-muted">{r.score}/100</td>
                        <td className="p-2 font-mono text-muted">~{r.tokensConsumed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 border-t border-subtle surface-header flex items-center justify-between">
          <button onClick={handleCopy} className="px-3.5 py-1.5 rounded-xl surface-card hover:surface-card-hover border border-subtle text-app-text flex items-center gap-1.5 transition-colors cursor-pointer font-medium">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Đã Sao Chép Markdown!' : 'Sao Chép Báo Cáo PR'}</span>
          </button>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all cursor-pointer">Hoàn Tất</button>
        </div>
      </div>
    </div>
  );
};
