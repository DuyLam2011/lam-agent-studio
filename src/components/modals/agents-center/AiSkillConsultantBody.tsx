import React from 'react';
import { Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { WorkspaceAndDiffSelector } from './architect/WorkspaceAndDiffSelector';
import { GrillMeInterviewPanel } from './architect/GrillMeInterviewPanel';
import { GrillMeQuestion } from '../../../types/ai-architect';
import { AgentSkill, AiSkillRecommendation } from '../../../types/skills';
import { AiSkillConsultantCard } from './AiSkillConsultantCard';

interface AiSkillConsultantBodyProps {
  userPrompt: string;
  setUserPrompt: (val: string) => void;
  selectedWsId: string;
  onSelectWsId: (id: string) => void;
  selectedRepoPath: string;
  onSelectRepoPath: (path: string) => void;
  includeDiff: boolean;
  onToggleIncludeDiff: (val: boolean) => void;
  gitDiffSnippet: string;
  onUpdateDiffSnippet: (diff: string) => void;
  step: 'input' | 'interview' | 'result' | 'recommendations';
  setStep: (s: 'input' | 'interview' | 'result' | 'recommendations') => void;
  isProcessing: boolean;
  onStartGrillMe: () => void;
  grillMeQuestions: GrillMeQuestion[];
  onSelectGrillMeOption: (qId: string, optKey: string) => void;
  onApplyRecommendedAll: () => void;
  onProceedSynthesis: () => void;
  generatedSkillContent: string;
  setGeneratedSkillContent: (val: string) => void;
  recommendations: AiSkillRecommendation[];
  agentSkills: AgentSkill[];
  onAdopt: (rec: AiSkillRecommendation) => Promise<void>;
  onRunConsultation: () => void;
  onReset: () => void;
}

export const AiSkillConsultantBody: React.FC<AiSkillConsultantBodyProps> = (props) => {
  const {
    userPrompt, setUserPrompt, selectedWsId, onSelectWsId,
    selectedRepoPath, onSelectRepoPath, includeDiff, onToggleIncludeDiff,
    gitDiffSnippet, onUpdateDiffSnippet, step, setStep, isProcessing,
    onStartGrillMe, grillMeQuestions, onSelectGrillMeOption,
    onApplyRecommendedAll, onProceedSynthesis, generatedSkillContent,
    setGeneratedSkillContent, recommendations, agentSkills, onAdopt,
    onRunConsultation, onReset
  } = props;

  return (
    <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
      <WorkspaceAndDiffSelector
        selectedWsId={selectedWsId} onSelectWsId={onSelectWsId}
        selectedRepoPath={selectedRepoPath} onSelectRepoPath={onSelectRepoPath}
        includeDiff={includeDiff} onToggleIncludeDiff={onToggleIncludeDiff}
        gitDiffSnippet={gitDiffSnippet} onUpdateDiffSnippet={onUpdateDiffSnippet}
      />

      <div className="flex items-center gap-2 border-b border-subtle pb-2">
        <button
          type="button"
          onClick={() => setStep('input')}
          className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${step !== 'recommendations' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-app-text'}`}
        >
          Tạo Skill Tùy Biến (Grill-Me)
        </button>
        <button
          type="button"
          onClick={() => { setStep('recommendations'); if (recommendations.length === 0) onRunConsultation(); }}
          className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${step === 'recommendations' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted hover:text-app-text'}`}
        >
          Gợi Ý Tự Động ({recommendations.length})
        </button>
      </div>

      {step === 'input' && (
        <div className="flex flex-col gap-2.5 surface-card rounded-xl p-3 border border-subtle">
          <span className="font-semibold text-app-text text-[11px] uppercase tracking-wider">
            1. Mô Tả Nhiệm Vụ & Năng Lực Skill Bạn Muốn Tạo
          </span>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Ví dụ: Skill kiểm tra an ninh OWASP và xác thực token JWT, hoặc skill phân tích log lỗi và đề xuất bản vá..."
            className="w-full h-20 surface-input p-2.5 rounded-lg border border-subtle text-xs text-app-text outline-none resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={onStartGrillMe}
            disabled={isProcessing || !userPrompt.trim()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-40"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>Khởi Động Phỏng Vấn Grill-Me Thiết Kế Skill</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {step === 'interview' && (
        <GrillMeInterviewPanel
          questions={grillMeQuestions} onSelectOption={onSelectGrillMeOption}
          onApplyRecommendedAll={onApplyRecommendedAll} onProceedSynthesis={onProceedSynthesis}
          isSynthesizing={isProcessing}
        />
      )}

      {step === 'result' && (
        <div className="flex-1 flex flex-col gap-2 min-h-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mã Nguồn SKILL.md Hoàn Chỉnh</span>
            <button onClick={onReset} className="text-[10.5px] text-primary hover:underline flex items-center gap-1 font-medium"><RefreshCw size={10} /><span>Tạo lại</span></button>
          </div>
          <textarea
            value={generatedSkillContent}
            onChange={(e) => setGeneratedSkillContent(e.target.value)}
            className="flex-1 w-full bg-black/50 border border-primary/20 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed outline-none resize-none custom-scrollbar"
          />
        </div>
      )}

      {step === 'recommendations' && (
        <div className="space-y-2.5">
          {recommendations.map((rec) => {
            const isAdopted = agentSkills.some(s => s.folderName === rec.folderName || s.name === rec.name);
            return <AiSkillConsultantCard key={rec.id} rec={rec} onAdopt={onAdopt} isAdopted={isAdopted} />;
          })}
        </div>
      )}
    </div>
  );
};
