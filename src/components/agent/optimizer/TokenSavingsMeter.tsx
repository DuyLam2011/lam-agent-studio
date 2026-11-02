import React from 'react';
import { TokenEstimationReport, ContextOptimizationAction } from '../../../services/chatPromptOptimizerService';
import { ArrowDownRight, CheckCircle2, Zap } from 'lucide-react';

interface TokenSavingsMeterProps {
  report: TokenEstimationReport;
  onApplyAction: (action: ContextOptimizationAction) => void;
}

export const TokenSavingsMeter: React.FC<TokenSavingsMeterProps> = ({ report, onApplyAction }) => {
  return (
    <div className="space-y-2 py-1 text-xs">
      {/* Metrics Row */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
        <div className="space-y-0.5">
          <div className="text-[10px] text-app-muted uppercase tracking-wider">Estimated Budget</div>
          <div className="font-mono text-xs font-semibold text-app-text">
            ~{report.totalTokens.toLocaleString()} tokens
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report.potentialSavingsPercent > 0 ? (
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <ArrowDownRight size={11} /> -{report.potentialSavingsPercent}% (~{report.potentialSavingsTokens.toLocaleString()} tokens)
              </span>
              <div className="text-[9px] text-app-muted mt-0.5">Savings opportunity</div>
            </div>
          ) : (
            <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
              <CheckCircle2 size={11} /> Token Budget Optimal
            </span>
          )}
        </div>
      </div>

      {/* Recommended Optimizations List */}
      {report.recommendedActions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-app-muted uppercase tracking-wider px-0.5">
            Actionable Reductions
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
            {report.recommendedActions.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-app-text">{act.title}</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      -{act.percentageSavings}% (~{act.estimatedSavingsTokens.toLocaleString()} tokens)
                    </span>
                  </div>
                  <div className="text-[9.5px] text-app-muted line-clamp-1">{act.description}</div>
                </div>

                <button
                  type="button"
                  onClick={() => onApplyAction(act)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition-colors"
                  title="Apply optimization"
                >
                  <Zap size={10} className="text-amber-400" />
                  <span>Apply</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
