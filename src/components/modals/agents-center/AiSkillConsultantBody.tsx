import React from 'react';
import { Sparkles, Loader2, Bot, RefreshCw } from 'lucide-react';
import { AgentSkill, AiSkillRecommendation } from '../../../types/skills';
import { AiSkillConsultantCard } from './AiSkillConsultantCard';

interface AiSkillConsultantBodyProps {
  currentScopeType: string;
  targetRepoPath?: string;
  isConsulting: boolean;
  recommendations: AiSkillRecommendation[];
  agentSkills: AgentSkill[];
  onConsult: () => void;
  onAdopt: (rec: AiSkillRecommendation) => Promise<void>;
}

export const AiSkillConsultantBody: React.FC<AiSkillConsultantBodyProps> = ({
  currentScopeType,
  targetRepoPath,
  isConsulting,
  recommendations,
  agentSkills,
  onConsult,
  onAdopt
}) => {
  return (
    <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
        <div>
          <div className="font-semibold text-purple-200">Scope: {currentScopeType.toUpperCase()}</div>
          <div className="text-[10px] text-gray-400 font-mono truncate max-w-sm">{targetRepoPath || 'All Workspaces'}</div>
        </div>
        <button
          onClick={onConsult}
          disabled={isConsulting}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={12} className={isConsulting ? "animate-spin" : ""} />
          <span>{recommendations.length > 0 ? 'Re-Analyze' : 'Run Consultation'}</span>
        </button>
      </div>

      {recommendations.length === 0 && !isConsulting && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 border border-dashed border-white/10 rounded-xl">
          <Bot size={32} className="text-purple-400 opacity-60" />
          <p className="text-xs text-gray-300 font-medium">Ready to analyze codebase and recommend optimal skills</p>
          <button
            onClick={onConsult}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Sparkles size={13} />
            <span>Start AI Skill Consultation</span>
          </button>
        </div>
      )}

      {isConsulting && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-2">
          <Loader2 size={24} className="animate-spin text-purple-400" />
          <span className="text-xs text-gray-300 font-mono">Synthesizing platform recommendations...</span>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Recommended Skills ({recommendations.length})
          </div>
          {recommendations.map((rec) => {
            const isAdopted = agentSkills.some(s => s.folderName === rec.folderName || s.name === rec.name);
            return <AiSkillConsultantCard key={rec.id} rec={rec} onAdopt={onAdopt} isAdopted={isAdopted} />;
          })}
        </div>
      )}
    </div>
  );
};
