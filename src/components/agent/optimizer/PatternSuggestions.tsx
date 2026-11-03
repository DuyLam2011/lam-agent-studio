import React from 'react';
import { PROMPT_PATTERNS, PromptPattern } from '../../../services/advisory/chatPromptOptimizerService';
import { Shield, CheckCircle2, FileCode, Terminal, Palette, Zap } from 'lucide-react';

interface PatternSuggestionsProps {
  onSelectPattern: (template: string) => void;
}

const getPatternIcon = (id: string) => {
  switch (id) {
    case 'security_audit': return <Shield size={11} className="text-gray-300 shrink-0" />;
    case 'code_review': return <CheckCircle2 size={11} className="text-gray-300 shrink-0" />;
    case 'surgical_patch': return <FileCode size={11} className="text-gray-300 shrink-0" />;
    case 'runtime_diagnosis': return <Terminal size={11} className="text-gray-300 shrink-0" />;
    case 'ui_inspection': return <Palette size={11} className="text-gray-300 shrink-0" />;
    default: return <Zap size={11} className="text-gray-300 shrink-0" />;
  }
};

export const PatternSuggestions: React.FC<PatternSuggestionsProps> = ({ onSelectPattern }) => {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between text-[10px] text-app-muted px-0.5">
        <span className="font-semibold uppercase tracking-wider">Suggested Prompt Patterns</span>
        <span>Click to insert</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {PROMPT_PATTERNS.map((pattern: PromptPattern) => (
          <button
            key={pattern.id}
            type="button"
            onClick={() => onSelectPattern(pattern.template)}
            className="flex items-start gap-1.5 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 text-left transition-colors group"
          >
            <div className="mt-0.5">{getPatternIcon(pattern.id)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-app-text truncate group-hover:text-white">
                {pattern.label}
              </div>
              <div className="text-[9.5px] text-app-muted truncate leading-tight">
                {pattern.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
