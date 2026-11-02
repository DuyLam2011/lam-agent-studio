import React from 'react';
import { SubagentRecommendation } from '../../../services/chatPromptOptimizerService';
import { Bot, Plus, Sparkles } from 'lucide-react';

interface SubagentAdvisorProps {
  recommendations: SubagentRecommendation[];
  onInsertTag: (tag: string) => void;
}

export const SubagentAdvisor: React.FC<SubagentAdvisorProps> = ({ recommendations, onInsertTag }) => {
  if (recommendations.length === 0) {
    return (
      <div className="py-2 px-1 text-center text-[10.5px] text-app-muted font-mono">
        Type keywords like <span className="text-gray-300">review</span>, <span className="text-gray-300">security</span>, <span className="text-gray-300">log</span>, or <span className="text-gray-300">ui</span> to see specialist routing recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-[10px] text-app-muted px-0.5">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={11} className="text-primary" /> Recommended Subagents for Intent
        </span>
        <span>Click tag to route</span>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <Bot size={13} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-app-text">{rec.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-300">
                    {rec.tag}
                  </span>
                </div>
                <div className="text-[9.5px] text-app-muted line-clamp-1">{rec.reason}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onInsertTag(rec.tag)}
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary text-[10px] font-medium transition-colors"
              title={`Tag ${rec.tag} into prompt`}
            >
              <Plus size={11} /> <span>Route</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
