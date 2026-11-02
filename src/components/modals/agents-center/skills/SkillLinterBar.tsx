import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, FileText, ShieldAlert, Cpu } from 'lucide-react';
import { SkillQualityReport } from '../../../../types/skill-studio';
import clsx from 'clsx';

interface SkillLinterBarProps {
  report: SkillQualityReport;
}

export const SkillLinterBar: React.FC<SkillLinterBarProps> = ({ report }) => {
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'A+ Chuẩn Cao', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (score >= 75) return { label: 'B Đạt Chuẩn', bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    return { label: 'Cần Tối Ưu', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  };

  const badge = getScoreBadge(report.score);

  return (
    <div className="surface-card p-3 rounded-xl border border-subtle flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={clsx("px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1", badge.bg)}>
            <Sparkles size={11} /> {report.score}/100 • {badge.label}
          </span>
          <span className="text-[11px] text-muted font-mono flex items-center gap-1">
            <Cpu size={12} className="text-primary" /> ~{report.estimatedTokens} tokens ({report.wordCount} từ)
          </span>
        </div>

        {/* Feature Check Status */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
          <span className={clsx("px-1.5 py-0.5 rounded border flex items-center gap-1", report.isFrontmatterValid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
            {report.isFrontmatterValid ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />} YAML Header
          </span>
          <span className={clsx("px-1.5 py-0.5 rounded border flex items-center gap-1", report.hasClearTrigger ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20")}>
            {report.hasClearTrigger ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />} Trigger
          </span>
          <span className={clsx("px-1.5 py-0.5 rounded border flex items-center gap-1", report.hasVerificationStep ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-neutral-500/10 text-muted border-subtle")}>
            <FileText size={10} /> Verify Step
          </span>
          <span className={clsx("px-1.5 py-0.5 rounded border flex items-center gap-1", report.hasSafetyConstraint ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-neutral-500/10 text-muted border-subtle")}>
            <ShieldAlert size={10} /> Safety
          </span>
        </div>
      </div>

      {report.recommendations.length > 0 && (
        <div className="text-[10px] text-amber-300/90 surface-input px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex flex-col gap-0.5">
          {report.recommendations.slice(0, 2).map((rec: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
