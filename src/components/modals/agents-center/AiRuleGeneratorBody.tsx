import React from 'react';
import { Sparkles, Loader2, Bot } from 'lucide-react';

interface AiRuleGeneratorBodyProps {
  isGenerating: boolean;
  generatedRules: string;
  setGeneratedRules: (val: string) => void;
  targetRepoPath?: string;
  currentScopeType: string;
  targetFileName: string;
  setTargetFileName: (val: string) => void;
  onGenerate: () => void;
}

export const AiRuleGeneratorBody: React.FC<AiRuleGeneratorBodyProps> = ({
  isGenerating,
  generatedRules,
  setGeneratedRules,
  targetRepoPath,
  currentScopeType,
  targetFileName,
  setTargetFileName,
  onGenerate
}) => {
  return (
    <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
        <div>
          <div className="font-semibold text-purple-200">Target Scope: {currentScopeType.toUpperCase()}</div>
          <div className="text-[10px] text-gray-400 font-mono truncate max-w-sm">{targetRepoPath || 'All Workspaces'}</div>
        </div>
        <select
          value={targetFileName}
          onChange={(e) => setTargetFileName(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 outline-none"
        >
          <option value="GEMINI.md">GEMINI.md</option>
          <option value="CLAUDE.md">CLAUDE.md</option>
          <option value=".cursorrules">.cursorrules</option>
          <option value=".rules">.rules</option>
        </select>
      </div>

      {!generatedRules && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 border border-dashed border-white/10 rounded-xl">
          <Bot size={32} className="text-purple-400 opacity-60" />
          <p className="text-xs text-gray-300 font-medium">Ready to analyze workspace structure and tech stack</p>
          <button
            onClick={onGenerate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Sparkles size={13} />
            <span>Analyze & Generate Tailored Rules</span>
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
          <Loader2 size={24} className="animate-spin text-purple-400" />
          <span className="text-xs text-gray-300 font-mono">Analyzing codebase conventions...</span>
        </div>
      )}

      {generatedRules && (
        <div className="flex-1 flex flex-col min-h-[260px]">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Synthesized Rules Preview</span>
          <textarea
            value={generatedRules}
            onChange={(e) => setGeneratedRules(e.target.value)}
            className="flex-1 w-full bg-black/50 border border-purple-500/20 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed outline-none resize-none custom-scrollbar"
          />
        </div>
      )}
    </div>
  );
};
