import React, { useState } from 'react';
import { X, Sparkles, Download } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AiSkillRecommendation } from '../../../types/skills';
import { AiSkillConsultantBody } from './AiSkillConsultantBody';
import { consultAiForSkills } from './aiSkillConsultantHelper';
import { GrillMeQuestion } from '../../../types/ai-architect';
import { generateGrillMeQuestions, synthesizeTailoredArtifact } from '../../../services/architect/aiArchitectClarificationService';

interface AiSkillConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSkillConsultantModal: React.FC<AiSkillConsultantModalProps> = ({ isOpen, onClose }) => {
  const { systemContext, currentRuleScope, addSkill, addToast, engineSettings, agentSkills } = useAgentStore();
  const defaultWs = systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId) || systemContext.workspaces[0];
  const defaultRepo = (currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : defaultWs?.folders?.[0]) || '';

  const [selectedWsId, setSelectedWsId] = useState(defaultWs?.id || '');
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(defaultRepo);
  const [includeDiff, setIncludeDiff] = useState(true);
  const [gitDiffSnippet, setGitDiffSnippet] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [step, setStep] = useState<'input' | 'interview' | 'result' | 'recommendations'>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [grillMeQuestions, setGrillMeQuestions] = useState<GrillMeQuestion[]>([]);
  const [generatedSkillContent, setGeneratedSkillContent] = useState('');
  const [generatedFolderName, setGeneratedFolderName] = useState('');
  const [recommendations, setRecommendations] = useState<AiSkillRecommendation[]>([]);

  if (!isOpen) return null;
  const activeWs = systemContext.workspaces.find(w => w.id === selectedWsId) || defaultWs;

  const handleStartGrillMe = async () => {
    if (!userPrompt.trim()) return addToast('Please enter desired skill capabilities', 'error');
    setIsProcessing(true);
    try {
      const q = await generateGrillMeQuestions({
        targetType: 'skill', userPrompt, workspaceId: selectedWsId, workspaceName: activeWs?.name,
        repoPath: selectedRepoPath, repoName: (selectedRepoPath || '').split(/[/\\]/).pop(),
        gitDiffSnippet: includeDiff ? gitDiffSnippet : undefined
      }, engineSettings.selectedModel);
      setGrillMeQuestions(q);
      setStep('interview');
    } catch { addToast('Failed to start Grill-Me for Skill', 'error'); }
    finally { setIsProcessing(false); }
  };

  const handleProceedSynthesis = async () => {
    setIsProcessing(true);
    try {
      const res = await synthesizeTailoredArtifact({
        targetType: 'skill', userPrompt, workspaceId: selectedWsId, workspaceName: activeWs?.name,
        repoPath: selectedRepoPath, repoName: (selectedRepoPath || '').split(/[/\\]/).pop(),
        gitDiffSnippet: includeDiff ? gitDiffSnippet : undefined
      }, grillMeQuestions, engineSettings.selectedModel);
      setGeneratedSkillContent(res.content);
      setGeneratedFolderName(res.folderName || 'custom_skill');
      setStep('result');
      addToast('AI Architect synthesized SKILL.md successfully!', 'success');
    } catch { addToast('Error synthesizing skill', 'error'); }
    finally { setIsProcessing(false); }
  };

  const handleSaveSkill = async () => {
    if (!generatedSkillContent.trim()) return;
    try {
      let savedPath: string | undefined;
      const folder = generatedFolderName || 'custom_skill';
      if (selectedRepoPath) {
        const res = await (window as any).lamApi?.skills?.saveSkill?.(selectedRepoPath, folder, generatedSkillContent);
        if (res?.success) savedPath = res.filePath;
      }
      const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
      addSkill({
        id: `ai-skill-${Date.now()}`, name: userPrompt.slice(0, 36) || folder, folderName: folder,
        description: `Skill designed via Grill-Me for ${activeWs?.name || 'Workspace'}`, content: generatedSkillContent,
        scope: targetScope, targetId: targetScope === 'repo' ? selectedRepoPath : (targetScope === 'workspace' ? selectedWsId : undefined),
        source: 'ai-generated', filePath: savedPath, active: true, updatedAt: Date.now()
      });
      addToast(`Installed skill successfully!`, 'success');
      onClose();
    } catch { addToast('Failed to save skill', 'error'); }
  };

  const handleAdoptAuto = async (rec: AiSkillRecommendation) => {
    let savedPath: string | undefined;
    if (selectedRepoPath) {
      const res = await (window as any).lamApi?.skills?.saveSkill?.(selectedRepoPath, rec.folderName, rec.suggestedContent);
      if (res?.success) savedPath = res.filePath;
    }
    addSkill({
      id: `ai-skill-${Date.now()}`, name: rec.name, folderName: rec.folderName, description: rec.description,
      content: rec.suggestedContent, scope: 'workspace', targetId: selectedWsId, source: 'ai-generated',
      filePath: savedPath, category: rec.category, active: true, updatedAt: Date.now()
    });
    addToast(`Adopted skill: ${rec.name}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[740px] max-h-[88vh] surface-modal rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-subtle flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center"><Sparkles size={14} /></div>
            <div>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">AI Skill Architect (Decision Level)</h3>
              <p className="text-[10px] text-gray-400">Design specialized capabilities based on Workspace, Git Diff & Technical Interview</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={15} /></button>
        </div>

        <AiSkillConsultantBody
          userPrompt={userPrompt} setUserPrompt={setUserPrompt}
          selectedWsId={selectedWsId} onSelectWsId={setSelectedWsId} selectedRepoPath={selectedRepoPath} onSelectRepoPath={setSelectedRepoPath}
          includeDiff={includeDiff} onToggleIncludeDiff={setIncludeDiff} gitDiffSnippet={gitDiffSnippet} onUpdateDiffSnippet={setGitDiffSnippet}
          step={step} setStep={setStep} isProcessing={isProcessing} onStartGrillMe={handleStartGrillMe} grillMeQuestions={grillMeQuestions}
          onSelectGrillMeOption={(qId, optKey) => setGrillMeQuestions(prev => prev.map(q => q.id === qId ? { ...q, selectedOptionKey: optKey } : q))}
          onApplyRecommendedAll={() => setGrillMeQuestions(prev => prev.map(q => ({ ...q, selectedOptionKey: q.options.find(o => o.recommended)?.key || 'A' })))}
          onProceedSynthesis={handleProceedSynthesis} generatedSkillContent={generatedSkillContent} setGeneratedSkillContent={setGeneratedSkillContent}
          recommendations={recommendations} agentSkills={agentSkills} onAdopt={handleAdoptAuto}
          onRunConsultation={async () => {
            setIsProcessing(true);
            try { setRecommendations(await consultAiForSkills(selectedRepoPath, activeWs?.name, engineSettings.selectedModel)); } catch {}
            finally { setIsProcessing(false); }
          }}
          onReset={() => { setStep('input'); setGeneratedSkillContent(''); }}
        />

        <div className="p-3.5 border-t border-subtle bg-black/40 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">Close</button>
          {step === 'result' && generatedSkillContent && (
            <button onClick={handleSaveSkill} className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors">
              <Download size={13} />
              <span>Install & Save SKILL.md</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
