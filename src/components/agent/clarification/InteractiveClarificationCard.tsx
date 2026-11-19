import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, Send, Edit3, X, Sparkles } from 'lucide-react';
import { ClarificationPrediction } from '../../../types/clarification-predictor';
import { compileClarificationDirective } from '../../../services/clarification/userClarificationPredictor';
import { ClarificationQuestionBlock } from './ClarificationQuestionBlock';
import { useAgentStore } from '../../../store/useAgentStore';
import { sendChatMessage } from '../../../services/agent-chat/agentRunService';

interface InteractiveClarificationCardProps {
  prediction: ClarificationPrediction;
  onDismiss?: () => void;
}

export const InteractiveClarificationCard: React.FC<InteractiveClarificationCardProps> = ({
  prediction,
  onDismiss
}) => {
  const { setChatInputDraft, addToast } = useAgentStore();
  const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const q of prediction.questions) {
      const rec = q.options.find(o => o.isRecommended) || q.options[0];
      if (rec) init[q.id] = [rec.id];
    }
    return init;
  });
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (qId: string, optId: string, isMulti?: boolean) => {
    setSelectedMap(prev => {
      const cur = prev[qId] || [];
      if (!isMulti) return { ...prev, [qId]: [optId] };
      return { ...prev, [qId]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] };
    });
  };

  const handleExecute = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const directive = compileClarificationDirective(prediction, selectedMap, customNote);
    addToast('Clarification confirmed. Executing agent workflow...', 'info');
    try {
      await sendChatMessage(directive);
      onDismiss?.();
    } catch (err: any) {
      addToast(err?.message || 'Failed to dispatch workflow', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraft = () => {
    const directive = compileClarificationDirective(prediction, selectedMap, customNote);
    setChatInputDraft(directive);
    addToast('Loaded resolved decisions into chat input', 'info');
  };

  return (
    <div className="surface-card rounded-2xl border border-cyan-500/40 p-4 space-y-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150">
      {/* 1. Header with Category & Necessity Score */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <HelpCircle size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-gray-100">Proactive Clarification & Decision Gate</h4>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {prediction.necessityScore}% Necessity
              </span>
            </div>
            <p className="text-[10.5px] text-gray-400 mt-0.5">{prediction.summary}</p>
          </div>
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5">
            <X size={14} />
          </button>
        )}
      </div>

      {/* 2. Inferred Risks Warning */}
      {prediction.inferredRisks.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[10.5px] space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-300">
            <AlertTriangle size={12} /> <span>Potential Risks of Guessing without Alignment:</span>
          </div>
          <div className="pl-4 space-y-0.5 list-disc text-amber-200/90 text-[10px]">
            {prediction.inferredRisks.map((r, i) => <div key={i}>• {r}</div>)}
          </div>
        </div>
      )}

      {/* 3. Question Blocks */}
      <div className="space-y-2.5">
        {prediction.questions.map(q => (
          <ClarificationQuestionBlock
            key={q.id}
            question={q}
            selectedOptionIds={selectedMap[q.id] || []}
            onToggleOption={handleToggle}
          />
        ))}
      </div>

      {/* 4. Custom Constraints Input */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
          <Sparkles size={11} className="text-cyan-400" />
          <span>Additional Constraints or Preferred Libraries (Optional):</span>
        </label>
        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="e.g., must use Redis session store, keep Rule 4 compliance..."
          className="w-full px-2.5 py-1.5 rounded-xl surface-input border border-white/10 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* 5. Action Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDraft}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition-colors"
        >
          <Edit3 size={12} /> <span>Edit in Chat</span>
        </button>

        <button
          type="button"
          onClick={handleExecute}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <Send size={12} />
          <span>Confirm & Execute Decisions</span>
        </button>
      </div>
    </div>
  );
};
