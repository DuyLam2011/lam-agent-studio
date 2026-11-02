import React from 'react';
import { Award, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { BenchmarkReport } from '../../../types/benchmark';
import clsx from 'clsx';

export const BenchmarkReportCard: React.FC<{ report: BenchmarkReport }> = ({ report }) => {
  const isHigh = report.overallScore >= 85;
  const isMed = report.overallScore >= 65;

  return (
    <div className="surface-card border border-subtle rounded-2xl p-4 space-y-3.5">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={clsx(
            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm",
            isHigh ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
            isMed ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
            "bg-rose-500/20 text-rose-400 border border-rose-500/40"
          )}>
            <Award size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">Benchmark Score</span>
              <span className={clsx(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                isHigh ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                isMed ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                "text-rose-400 bg-rose-500/10 border-rose-500/30"
              )}>
                {report.rating}
              </span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5">{report.summary}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-primary font-mono leading-none">
            {report.overallScore}<span className="text-xs font-normal text-muted">/100</span>
          </div>
          <span className="text-[9px] text-muted">Peak CPU: {report.cpuPeakPercent}%</span>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2 pt-1 border-t border-subtle">
        {report.steps.map((st, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg surface-input">
            <div className="flex items-center gap-2">
              {st.status === 'passed' ? (
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
              )}
              <span className="text-primary font-medium">{st.name}</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-secondary">{st.durationMs}ms</span>
              <span className="text-primary font-semibold">{st.throughput} {st.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="pt-2 border-t border-subtle">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-muted mb-1.5">
            <Lightbulb size={11} className="text-amber-400" /> Recommendations
          </div>
          <ul className="space-y-1">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-[11px] text-secondary flex items-start gap-1.5">
                <span className="text-primary">•</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
