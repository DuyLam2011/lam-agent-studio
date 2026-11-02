import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ResourceAuditReport } from '../../../types/resource-audit';
import clsx from 'clsx';

interface ResourceAuditReportCardProps {
  report: ResourceAuditReport;
  useSanitized: boolean;
  onToggleSanitized: (useSanitized: boolean) => void;
}

export const ResourceAuditReportCard: React.FC<ResourceAuditReportCardProps> = ({
  report,
  useSanitized,
  onToggleSanitized,
}) => {
  const [showFindings, setShowFindings] = useState(false);

  const getVerdictStyle = () => {
    switch (report.verdict) {
      case 'SAFE':
        return { icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'AN TOÀN (CLEAN)' };
      case 'WARNING':
        return { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'CẢNH BÁO (WARNING)' };
      case 'DANGEROUS':
        return { icon: ShieldAlert, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', label: 'RỦI RO CAO (DANGEROUS)' };
      case 'REJECTED':
      default:
        return { icon: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'TỪ CHỐI (REJECTED)' };
    }
  };

  const { icon: VerdictIcon, color, label } = getVerdictStyle();

  return (
    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-xs flex flex-col gap-2 shadow-md">
      {/* Header Verdict & Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={clsx("p-1.5 rounded-lg border flex items-center justify-center", color)}>
            <VerdictIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-[11px]">{label}</span>
              <span className="text-[10px] text-slate-400 font-mono">Điểm an toàn: {report.safetyScore}/100</span>
            </div>
            <p className="text-[10px] text-slate-400">{report.summaryText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
            ~{report.estimatedTokens} tokens
          </span>
          {report.findings.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFindings(!showFindings)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Xem chi tiết vi phạm"
            >
              {showFindings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Sanitized Switch */}
      {report.verdict !== 'SAFE' && report.sanitizedContent && (
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            Khử độc mã nguồn (Auto-Sanitize)
          </span>
          <button
            type="button"
            onClick={() => onToggleSanitized(!useSanitized)}
            className={clsx(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border",
              useSanitized ? "bg-primary/20 text-primary border-primary/40 font-semibold" : "bg-slate-800 text-slate-400 border-slate-700"
            )}
          >
            {useSanitized ? 'Đang bật bản khử độc' : 'Dùng bản gốc'}
          </button>
        </div>
      )}

      {/* Expanded Findings List */}
      {showFindings && report.findings.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          {report.findings.map((f) => (
            <div key={f.id} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-[11px]">{f.title}</span>
                <span className={clsx(
                  "px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold",
                  f.severity === 'critical' ? 'text-red-400 bg-red-950/60 border border-red-500/30' :
                  f.severity === 'high' ? 'text-orange-400 bg-orange-950/60 border border-orange-500/30' :
                  f.severity === 'medium' ? 'text-amber-400 bg-amber-950/60 border border-amber-500/30' :
                  'text-slate-400 bg-slate-800 border border-slate-700'
                )}>
                  {f.severity}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{f.description}</p>
              {f.remediation && <p className="text-[10px] text-emerald-400/90 italic">Khuyến nghị: {f.remediation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
