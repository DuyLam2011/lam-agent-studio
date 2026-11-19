import React from 'react';
import { Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { WorkspaceAndDiffSelector } from './architect/WorkspaceAndDiffSelector';
import { GrillMeInterviewPanel } from './architect/GrillMeInterviewPanel';
import { GrillMeQuestion } from '../../../types/ai-architect';

interface AiRuleGeneratorBodyProps {
  userPrompt: string;
  setUserPrompt: (val: string) => void;
  targetFileName: string;
  setTargetFileName: (val: string) => void;
  selectedWsId: string;
  onSelectWsId: (id: string) => void;
  selectedRepoPath: string;
  onSelectRepoPath: (path: string) => void;
  includeDiff: boolean;
  onToggleIncludeDiff: (val: boolean) => void;
  gitDiffSnippet: string;
  onUpdateDiffSnippet: (diff: string) => void;
  step: 'input' | 'interview' | 'result';
  isProcessing: boolean;
  onStartGrillMe: () => void;
  grillMeQuestions: GrillMeQuestion[];
  onSelectGrillMeOption: (qId: string, optKey: string) => void;
  onApplyRecommendedAll: () => void;
  onProceedSynthesis: () => void;
  generatedRules: string;
  setGeneratedRules: (val: string) => void;
  onReset: () => void;
}

export const AiRuleGeneratorBody: React.FC<AiRuleGeneratorBodyProps> = (props) => {
  const {
    userPrompt, setUserPrompt, targetFileName, setTargetFileName,
    selectedWsId, onSelectWsId, selectedRepoPath, onSelectRepoPath,
    includeDiff, onToggleIncludeDiff, gitDiffSnippet, onUpdateDiffSnippet,
    step, isProcessing, onStartGrillMe, grillMeQuestions,
    onSelectGrillMeOption, onApplyRecommendedAll, onProceedSynthesis,
    generatedRules, setGeneratedRules, onReset
  } = props;

  return (
    <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
      <WorkspaceAndDiffSelector
        selectedWsId={selectedWsId} onSelectWsId={onSelectWsId}
        selectedRepoPath={selectedRepoPath} onSelectRepoPath={onSelectRepoPath}
        includeDiff={includeDiff} onToggleIncludeDiff={onToggleIncludeDiff}
        gitDiffSnippet={gitDiffSnippet} onUpdateDiffSnippet={onUpdateDiffSnippet}
      />

      {step === 'input' && (
        <div className="flex flex-col gap-2.5 surface-card rounded-xl p-3 border border-subtle">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-app-text text-[11px] uppercase tracking-wider">
              1. Enter Target Architecture & Objectives
            </span>
            <select
              value={targetFileName}
              onChange={(e) => setTargetFileName(e.target.value)}
              className="surface-input rounded-lg px-2.5 py-1 text-xs border border-subtle text-app-text font-mono outline-none"
            >
              <option value="GEMINI.md">GEMINI.md (Google / Multi-Model)</option>
              <option value="CLAUDE.md">CLAUDE.md (Anthropic Claude)</option>
              <option value=".cursorrules">.cursorrules</option>
              <option value=".rules">.rules</option>
            </select>
          </div>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g. Enforce modular architecture, file length <= 150 lines, test execution via Git Bash, zero placeholders, strict error handling..."
            className="w-full h-20 surface-input p-2.5 rounded-lg border border-subtle text-xs text-app-text outline-none resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={onStartGrillMe}
            disabled={isProcessing || !userPrompt.trim()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-40"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Start Technical Clarification Interview</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {step === 'interview' && (
        <GrillMeInterviewPanel
          questions={grillMeQuestions}
          onSelectOption={onSelectGrillMeOption}
          onApplyRecommendedAll={onApplyRecommendedAll}
          onProceedSynthesis={onProceedSynthesis}
          isSynthesizing={isProcessing}
        />
      )}

      {step === 'result' && (
        <div className="flex-1 flex flex-col gap-2 min-h-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Synthesized Specification ({targetFileName})
            </span>
            <button onClick={onReset} className="text-[10.5px] text-primary hover:underline flex items-center gap-1 font-medium">
              <RefreshCw size={10} />
              <span>Regenerate</span>
            </button>
          </div>
          <textarea
            value={generatedRules}
            onChange={(e) => setGeneratedRules(e.target.value)}
            className="flex-1 w-full bg-black/50 border border-primary/20 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed outline-none resize-none custom-scrollbar"
          />
        </div>
      )}
    </div>
  );
};
