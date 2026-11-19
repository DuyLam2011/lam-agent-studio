import React from 'react';
import { CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { DecisionQuestion } from '../../../../types/ai-architect';
import clsx from 'clsx';

interface DecisionInterviewPanelProps {
  questions: DecisionQuestion[];
  onSelectOption: (questionId: string, optionKey: string) => void;
  onApplyRecommendedAll: () => void;
  onProceedSynthesis: () => void;
  isSynthesizing: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  strictness: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  scope: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  triggers: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  negative_constraints: 'bg-rose-500/10 text-rose-400 border-rose-500/25'
};

export const DecisionInterviewPanel: React.FC<DecisionInterviewPanelProps> = ({
  questions, onSelectOption, onApplyRecommendedAll, onProceedSynthesis, isSynthesizing
}) => {
  return (
    <div className="surface-card rounded-xl p-3.5 border border-primary/25 space-y-3.5">
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-primary" />
          <h4 className="text-xs font-bold text-app-text uppercase tracking-wider">
            Agent Decision Level: Socratic Clarification Interview
          </h4>
        </div>
        <button
          type="button"
          onClick={onApplyRecommendedAll}
          className="text-[10.5px] text-primary hover:underline font-medium cursor-pointer"
        >
          Select All Recommended
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const catClass = CATEGORY_COLORS[q.category] || 'bg-white/5 text-gray-300 border-white/10';
          return (
            <div key={q.id || idx} className="p-2.5 rounded-lg bg-black/25 border border-subtle space-y-2">
              <div className="flex items-start gap-2">
                <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border shrink-0", catClass)}>
                  {q.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold text-app-text leading-snug">
                  {idx + 1}. {q.question}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {q.options.map((opt) => {
                  const isSelected = q.selectedOptionKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onSelectOption(q.id, opt.key)}
                      className={clsx(
                        "p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                        isSelected
                          ? "bg-primary/20 border-primary text-app-text shadow-sm"
                          : "bg-black/30 border-subtle text-secondary hover:text-app-text hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-bold text-[11px] text-primary">[{opt.key}] {opt.label}</span>
                        {isSelected && <CheckCircle2 size={12} className="text-primary shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted leading-tight line-clamp-2">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-subtle">
        <button
          type="button"
          onClick={onProceedSynthesis}
          disabled={isSynthesizing}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles size={13} />
          <span>{isSynthesizing ? 'Synthesizing...' : 'Confirm Decisions & Synthesize Specification'}</span>
        </button>
      </div>
    </div>
  );
};
