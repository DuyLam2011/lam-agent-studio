import React from 'react';
import { Target, X, CheckCircle2, Ban } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { TOOL_STRATEGY_CONFIGS } from '../../../services/decision-center/toolOptimizationRules';
import { ToolStrategyType } from '../../../services/decision-center/decisionCenterTypes';
import clsx from 'clsx';

interface DecisionCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionCenterModal: React.FC<DecisionCenterModalProps> = ({ isOpen, onClose }) => {
  const { toolDecisionState } = useAgentStore();
  if (!isOpen || !toolDecisionState) return null;

  const strategies = Object.keys(TOOL_STRATEGY_CONFIGS) as ToolStrategyType[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xl p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col gap-4 text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Decision Center: Tối Ưu Hóa Công Cụ Agent</h2>
              <p className="text-xs text-slate-400">Kiểm soát chuỗi thực thi tool và giảm thiểu token dư thừa</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Tool Strategy */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-primary/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Chiến Lược Được Chọn: {toolDecisionState.strategyTitle}</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/20 text-primary border border-primary/30">
              Độ tin cậy: {Math.round(toolDecisionState.confidence * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-300">{toolDecisionState.strategyDescription}</p>

          {/* Pipeline Steps */}
          {toolDecisionState.recommendedPipeline.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Chuỗi Tool Chuẩn Hóa:</span>
              {toolDecisionState.recommendedPipeline.map((step) => (
                <div key={step.step} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono">
                    {step.step}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
                    {step.tool}
                  </span>
                  <span className="text-[11px] text-slate-400">{step.purpose}</span>
                </div>
              ))}
            </div>
          )}

          {/* Disallowed Tools */}
          {toolDecisionState.prunedTools.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pt-1">
              <Ban className="w-3.5 h-3.5 shrink-0" />
              <span>Chặn tool dư thừa: {toolDecisionState.prunedTools.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Comparison Matrix */}
        <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Danh Mục Chiến Lược Tool</span>
          {strategies.map((st) => {
            const meta = TOOL_STRATEGY_CONFIGS[st];
            const isSelected = st === toolDecisionState.strategy;
            return (
              <div
                key={st}
                className={clsx(
                  "p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all",
                  isSelected ? "bg-primary/10 border-primary/50 text-white shadow-sm" : "bg-slate-800/30 border-slate-800 text-slate-400 opacity-75"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isSelected ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />}
                  <div className="truncate">
                    <p className="font-medium text-[11px] truncate">{meta.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{meta.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
