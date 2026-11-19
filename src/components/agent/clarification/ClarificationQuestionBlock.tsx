import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { PredictiveQuestion, PredictiveQuestionOption } from '../../../types/clarification-predictor';
import clsx from 'clsx';

interface ClarificationQuestionBlockProps {
  question: PredictiveQuestion;
  selectedOptionIds: string[];
  onToggleOption: (questionId: string, optionId: string, isMulti?: boolean) => void;
}

export const ClarificationQuestionBlock: React.FC<ClarificationQuestionBlockProps> = ({
  question,
  selectedOptionIds,
  onToggleOption
}) => {
  return (
    <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center justify-between gap-2">
        <h5 className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>{question.question}</span>
        </h5>
        {question.isMultiSelect && (
          <span className="text-[9px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20">
            Multi-select
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {question.options.map((opt: PredictiveQuestionOption) => {
          const isSelected = selectedOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggleOption(question.id, opt.id, question.isMultiSelect)}
              className={clsx(
                "w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 group",
                isSelected
                  ? "bg-cyan-950/40 border-cyan-500/60 text-cyan-100 shadow-md shadow-cyan-950/20"
                  : "surface-card border-transparent hover:border-white/10 text-gray-300"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isSelected ? (
                  <CheckCircle2 size={14} className="text-cyan-400" />
                ) : (
                  <Circle size={14} className="text-gray-500 group-hover:text-gray-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className={clsx("text-xs font-semibold", isSelected ? "text-cyan-200" : "text-gray-200 group-hover:text-white")}>
                    {opt.label}
                  </span>
                  {opt.badge && (
                    <span className={clsx(
                      "px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border",
                      opt.isRecommended
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-white/5 text-gray-400 border-white/10"
                    )}>
                      {opt.badge}
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{opt.description}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[9px] text-gray-400">
                  <span className="font-mono text-cyan-400">Impact:</span>
                  <span className="italic">{opt.impact}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
