import React from 'react';
import { SecurityAuditResult } from '../../../types/security';
import { ShieldCheck, AlertTriangle, ShieldAlert, Check, Ban } from 'lucide-react';
import clsx from 'clsx';

interface SecurityFindingCardProps {
  audit: SecurityAuditResult;
  onSanitize?: () => void;
  onQuarantine?: () => void;
}

export const SecurityFindingCard: React.FC<SecurityFindingCardProps> = ({ audit, onSanitize, onQuarantine }) => {
  const isCritical = audit.level === 'critical';
  const isWarning = audit.level === 'warning';

  return (
    <div className={clsx(
      "p-3 rounded-xl border backdrop-blur-md transition-all flex flex-col gap-2",
      isCritical ? "bg-rose-500/10 border-rose-500/30" :
      isWarning ? "bg-amber-500/10 border-amber-500/30" :
      "bg-emerald-500/5 border-emerald-500/20"
    )}>
      {/* Title & Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isCritical ? <ShieldAlert size={16} className="text-rose-400 shrink-0" /> :
           isWarning ? <AlertTriangle size={16} className="text-amber-400 shrink-0" /> :
           <ShieldCheck size={16} className="text-emerald-400 shrink-0" />}
          <span className="text-xs font-bold text-gray-200 truncate">{audit.name}</span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/5">
            {audit.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={clsx(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            isCritical ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
            isWarning ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
            "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          )}>
            Score: {audit.score}/100 • {audit.level.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Findings Breakdown */}
      {audit.findings.length > 0 ? (
        <div className="space-y-1.5 mt-1">
          {audit.findings.map((f, i) => (
            <div key={i} className="text-[11px] p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-gray-300 font-medium">
                <span className="text-rose-300 font-mono">[{f.type.toUpperCase()}]</span>
                <span className="text-[10px] text-gray-400 uppercase">{f.severity} severity</span>
              </div>
              <p className="text-gray-300">{f.message}</p>
              <p className="text-[10px] text-gray-500 italic">Recommendation: {f.suggestion}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-emerald-400/80">
          No security violations or prompt injection vectors detected. Clean and verified.
        </p>
      )}

      {/* Action Buttons if violations found */}
      {audit.findings.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1">
          {onSanitize && (
            <button
              onClick={onSanitize}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 text-[10px] font-semibold transition-all"
            >
              <Check size={11} />
              <span>Apply Sanitized Version</span>
            </button>
          )}
          {onQuarantine && (
            <button
              onClick={onQuarantine}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/30 text-[10px] font-semibold transition-all"
            >
              <Ban size={11} />
              <span>Quarantine Item</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
