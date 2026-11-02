import React, { useState } from 'react';
import { PatternSuggestions } from './PatternSuggestions';
import { SubagentAdvisor } from './SubagentAdvisor';
import { TokenSavingsMeter } from './TokenSavingsMeter';
import { TokenEstimationReport, ContextOptimizationAction } from '../../../services/chatPromptOptimizerService';
import { Sparkles, Bot, BarChart3, X } from 'lucide-react';
import clsx from 'clsx';

interface ChatOptimizerPanelProps {
  report: TokenEstimationReport;
  onSelectPattern: (template: string) => void;
  onInsertSubagentTag: (tag: string) => void;
  onApplyAction: (action: ContextOptimizationAction) => void;
}

type TabType = 'patterns' | 'subagents' | 'tokens';

export const ChatOptimizerPanel: React.FC<ChatOptimizerPanelProps> = ({
  report,
  onSelectPattern,
  onInsertSubagentTag,
  onApplyAction
}) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);

  const toggleTab = (tab: TabType) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="surface-card rounded-xl border border-white/5 p-2 space-y-2 select-none shadow-sm">
      {/* Mini Controls Bar */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleTab('patterns')}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border",
              activeTab === 'patterns'
                ? "bg-primary text-white border-primary"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
            )}
          >
            <Sparkles size={11} className={activeTab === 'patterns' ? "text-white" : "text-gray-400"} />
            <span>Patterns</span>
          </button>

          <button
            type="button"
            onClick={() => toggleTab('subagents')}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border",
              activeTab === 'subagents'
                ? "bg-primary text-white border-primary"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
            )}
          >
            <Bot size={11} className={activeTab === 'subagents' ? "text-white" : "text-gray-400"} />
            <span>Subagents ({report.recommendedSubagents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleTab('tokens')}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border",
              activeTab === 'tokens'
                ? "bg-primary text-white border-primary"
                : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
            )}
          >
            <BarChart3 size={11} className={activeTab === 'tokens' ? "text-white" : "text-gray-400"} />
            <span>Tokens (~{report.totalTokens.toLocaleString()})</span>
          </button>
        </div>

        {/* Live Token Savings Opportunity Indicator */}
        <div className="flex items-center gap-1.5 ml-auto">
          {report.potentialSavingsPercent > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('tokens')}
              className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              -{report.potentialSavingsPercent}% (~{report.potentialSavingsTokens.toLocaleString()} tokens saved)
            </button>
          )}

          {activeTab && (
            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="p-1 text-gray-400 hover:text-white rounded"
              title="Close options"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Tab Body */}
      {activeTab === 'patterns' && (
        <PatternSuggestions
          onSelectPattern={(template) => {
            onSelectPattern(template);
            setActiveTab(null);
          }}
        />
      )}

      {activeTab === 'subagents' && (
        <SubagentAdvisor
          recommendations={report.recommendedSubagents}
          onInsertTag={(tag) => {
            onInsertSubagentTag(tag);
            setActiveTab(null);
          }}
        />
      )}

      {activeTab === 'tokens' && (
        <TokenSavingsMeter
          report={report}
          onApplyAction={(act) => {
            onApplyAction(act);
            setActiveTab(null);
          }}
        />
      )}
    </div>
  );
};
