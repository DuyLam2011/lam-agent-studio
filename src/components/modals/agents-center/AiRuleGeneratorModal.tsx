import React, { useState } from 'react';
import { X, Sparkles, Download } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentRule } from '../../../types/rules';
import { AiRuleGeneratorBody } from './AiRuleGeneratorBody';
import { GrillMeQuestion } from '../../../types/ai-architect';
import { generateGrillMeQuestions, synthesizeTailoredArtifact } from '../../../services/architect/aiArchitectClarificationService';

interface AiRuleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiRuleGeneratorModal: React.FC<AiRuleGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { systemContext, currentRuleScope, addRule, addToast, engineSettings } = useAgentStore();
  const defaultWs = systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId) || systemContext.workspaces[0];
  const defaultRepo = (currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : defaultWs?.folders?.[0]) || '';

  const [selectedWsId, setSelectedWsId] = useState(defaultWs?.id || '');
  const [selectedRepoPath, setSelectedRepoPath] = useState<string>(defaultRepo);
  const [includeDiff, setIncludeDiff] = useState(true);
  const [gitDiffSnippet, setGitDiffSnippet] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [targetFileName, setTargetFileName] = useState('GEMINI.md');
  const [step, setStep] = useState<'input' | 'interview' | 'result'>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [grillMeQuestions, setGrillMeQuestions] = useState<GrillMeQuestion[]>([]);
  const [generatedRules, setGeneratedRules] = useState('');

  if (!isOpen) return null;
  const activeWs = systemContext.workspaces.find(w => w.id === selectedWsId) || defaultWs;

  const handleStartGrillMe = async () => {
    if (!userPrompt.trim()) return addToast('Please enter desired rule guidelines', 'error');
    setIsProcessing(true);
    try {
      const questions = await generateGrillMeQuestions({
        targetType: 'rule', userPrompt, workspaceId: selectedWsId, workspaceName: activeWs?.name,
        repoPath: selectedRepoPath, repoName: (selectedRepoPath || '').split(/[/\\]/).pop(),
        gitDiffSnippet: includeDiff ? gitDiffSnippet : undefined, targetFileName
      }, engineSettings.selectedModel);
      setGrillMeQuestions(questions);
      setStep('interview');
    } catch {
      addToast('Failed to initialize Grill-Me interview', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectGrillMeOption = (qId: string, optKey: string) => {
    setGrillMeQuestions(prev => prev.map(q => q.id === qId ? { ...q, selectedOptionKey: optKey } : q));
  };

  const handleApplyRecommendedAll = () => {
    setGrillMeQuestions(prev => prev.map(q => ({ ...q, selectedOptionKey: q.options.find(o => o.recommended)?.key || 'A' })));
    addToast('Selected all best practice recommendations', 'info');
  };

  const handleProceedSynthesis = async () => {
    setIsProcessing(true);
    try {
      const res = await synthesizeTailoredArtifact({
        targetType: 'rule', userPrompt, workspaceId: selectedWsId, workspaceName: activeWs?.name,
        repoPath: selectedRepoPath, repoName: (selectedRepoPath || '').split(/[/\\]/).pop(),
        gitDiffSnippet: includeDiff ? gitDiffSnippet : undefined, targetFileName
      }, grillMeQuestions, engineSettings.selectedModel);
      setGeneratedRules(res.content);
      setStep('result');
      addToast('AI Architect synthesized rules successfully!', 'success');
    } catch {
      addToast('Error synthesizing rules', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToFile = async () => {
    if (!generatedRules.trim()) return;
    try {
      if (selectedRepoPath) {
        const fullPath = `${selectedRepoPath}/${targetFileName}`;
        await (window as any).lamApi?.fs?.saveFile?.(fullPath, generatedRules);
        addToast(`Saved rule file to ${fullPath}`, 'success');
      }
      const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
      const rule: AgentRule = {
        id: `ai-rule-${Date.now()}`, name: `Tailored: ${targetFileName}`,
        description: `Standardized architecture rules for ${activeWs?.name || 'Workspace'}`,
        content: generatedRules, scope: targetScope,
        targetId: targetScope === 'repo' ? selectedRepoPath : (targetScope === 'workspace' ? selectedWsId : undefined),
        source: 'ai-generated', filePath: selectedRepoPath ? `${selectedRepoPath}/${targetFileName}` : undefined,
        active: true, updatedAt: Date.now()
      };
      addRule(rule);
      onClose();
    } catch {
      addToast('Failed to save rule file', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[740px] max-h-[88vh] surface-modal rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-3.5 border-b border-subtle flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center"><Sparkles size={14} /></div>
            <div>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">AI Rule Architect (Decision Level)</h3>
              <p className="text-[10px] text-gray-400">Context-aware workspace & git diff analysis with technical clarification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={15} /></button>
        </div>

        <AiRuleGeneratorBody
          userPrompt={userPrompt} setUserPrompt={setUserPrompt} targetFileName={targetFileName} setTargetFileName={setTargetFileName}
          selectedWsId={selectedWsId} onSelectWsId={setSelectedWsId} selectedRepoPath={selectedRepoPath} onSelectRepoPath={setSelectedRepoPath}
          includeDiff={includeDiff} onToggleIncludeDiff={setIncludeDiff} gitDiffSnippet={gitDiffSnippet} onUpdateDiffSnippet={setGitDiffSnippet}
          step={step} isProcessing={isProcessing} onStartGrillMe={handleStartGrillMe} grillMeQuestions={grillMeQuestions}
          onSelectGrillMeOption={handleSelectGrillMeOption} onApplyRecommendedAll={handleApplyRecommendedAll}
          onProceedSynthesis={handleProceedSynthesis} generatedRules={generatedRules} setGeneratedRules={setGeneratedRules}
          onReset={() => { setStep('input'); setGeneratedRules(''); }}
        />

        <div className="p-3.5 border-t border-subtle bg-black/40 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">Đóng</button>
          {step === 'result' && generatedRules && (
            <button onClick={handleSaveToFile} className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors">
              <Download size={13} />
              <span>Áp dụng & Lưu {targetFileName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
