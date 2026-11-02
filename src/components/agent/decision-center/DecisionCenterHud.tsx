import React, { useState } from 'react';
import { Target, Zap, ArrowRight, X, ChevronRight, FileCode } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { TOOL_STRATEGY_CONFIGS } from '../../../services/decision-center/toolOptimizationRules';
import clsx from 'clsx';

interface DecisionCenterHudProps {
  onOpenDetails?: () => void;
}

export const DecisionCenterHud: React.FC<DecisionCenterHudProps> = ({ onOpenDetails }) => {
  const { toolDecisionState } = useAgentStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!toolDecisionState || isDismissed) return null;

  const config = TOOL_STRATEGY_CONFIGS[toolDecisionState.strategy];

  return (
    <div className="mx-3 mt-1.5 mb-1 p-2 rounded-xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-md shadow-lg flex flex-col gap-1.5 text-xs select-none animate-fade-in">
      {/* Top Header: Decision Center Title & Badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded-lg bg-primary/20 text-primary">
            <Target className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-100 truncate text-[11px]">
            {toolDecisionState.strategyTitle}
          </span>
          <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-mono border", config.badgeColor)}>
            Độ tin cậy: {Math.round(toolDecisionState.confidence * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3 h-3" />
            {toolDecisionState.tokenSavingsEstimate}
          </span>

          {onOpenDetails && (
            <button
              type="button"
              onClick={onOpenDetails}
              className="px-1.5 py-0.5 rounded text-[10px] text-primary hover:bg-primary/10 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              Chi tiết
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Đóng thanh Decision Center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recommended Tool Sequence Pipeline */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60 text-[11px]">
        <span className="text-[10px] text-slate-500">Chuỗi tool:</span>
        {toolDecisionState.recommendedPipeline.length === 0 ? (
          <span className="text-[10px] text-slate-400 italic">Không dùng tool (Trả lời trực tiếp)</span>
        ) : (
          toolDecisionState.recommendedPipeline.map((step, idx) => (
            <React.Fragment key={step.step}>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700" title={step.purpose}>
                {step.tool}
              </span>
              {idx < toolDecisionState.recommendedPipeline.length - 1 && (
                <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          ))
        )}

        {toolDecisionState.targetScope && (
          <div className="flex items-center gap-1 ml-auto">
            <FileCode className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]" title={toolDecisionState.targetScope}>
              {toolDecisionState.targetScope}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
