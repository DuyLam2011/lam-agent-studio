import React, { useState } from 'react';
import { X, Sparkles, Download } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentRule } from '../../../types/rules';
import { AiRuleGeneratorBody } from './AiRuleGeneratorBody';

interface AiRuleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiRuleGeneratorModal: React.FC<AiRuleGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { systemContext, currentRuleScope, addRule, addToast, engineSettings } = useAgentStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRules, setGeneratedRules] = useState('');
  const [targetFileName, setTargetFileName] = useState('GEMINI.md');

  if (!isOpen) return null;

  const currentWorkspace = systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId) || systemContext.workspaces[0];
  const targetRepoPath = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : currentWorkspace?.folders?.[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedRules('');

    try {
      let packageInfo = '';
      if (targetRepoPath) {
        try {
          // @ts-ignore
          const pkgRes = await window.lamApi?.fs?.readFile?.(`${targetRepoPath}/package.json`);
          if (pkgRes?.success) packageInfo = pkgRes.data.slice(0, 1000);
        } catch {}
      }

      const prompt = `You are a Principal Software Architect. Inspect the current workspace and generate an optimal, comprehensive, and tailored AI rule file (${targetFileName}) for this codebase.
Workspace: ${currentWorkspace?.name || 'Current Project'}
Repo: ${targetRepoPath || 'Root'}
Package excerpt:
${packageInfo}

Format the rules in clean markdown with sections:
1. Role & Tech Stack Directives (Strict TypeScript, Frameworks)
2. Architectural Principles & Modularity (<150 lines per component)
3. Styling & UX Design Standards (Glassmorphism, TailwindCSS)
4. Execution & Testing Protocols`;

      // @ts-ignore
      const response = await window.lamApi?.ai?.sendPrompt?.(prompt, {
        model: engineSettings.selectedModel,
        mode: 'vibe',
        persona: 'architect'
      });

      if (response?.text) {
        setGeneratedRules(response.text);
        addToast('AI Architect synthesized tailored workspace rules!', 'success');
      }
    } catch {
      addToast('Failed to generate rules with AI', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToFile = async () => {
    if (!generatedRules.trim()) return;

    try {
      if (targetRepoPath) {
        const fullPath = `${targetRepoPath}/${targetFileName}`;
        // @ts-ignore
        await window.lamApi?.fs?.saveFile?.(fullPath, generatedRules);
        addToast(`Saved tailored rule file to ${fullPath}`, 'success');
      }

      const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
      const rule: AgentRule = {
        id: `ai-rule-${Date.now()}`,
        name: `AI Tailored: ${targetFileName}`,
        description: `Automated AI-architected rules for ${currentWorkspace?.name || 'Workspace'}`,
        content: generatedRules,
        scope: targetScope,
        targetId: targetScope === 'repo' ? currentRuleScope.repoPath : (targetScope === 'workspace' ? currentWorkspace?.id : undefined),
        source: 'ai-generated',
        filePath: targetRepoPath ? `${targetRepoPath}/${targetFileName}` : undefined,
        active: true,
        updatedAt: Date.now()
      };
      addRule(rule);
      onClose();
    } catch {
      addToast('Failed to save rule file', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[720px] max-h-[88vh] bg-neutral-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">AI Workspace Rule Architect</h3>
              <p className="text-[10px] text-gray-400">Scans workspace to synthesize an optimal, tailored rule file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={15} />
          </button>
        </div>

        <AiRuleGeneratorBody
          isGenerating={isGenerating}
          generatedRules={generatedRules}
          setGeneratedRules={setGeneratedRules}
          targetRepoPath={targetRepoPath}
          currentScopeType={currentRuleScope.type}
          targetFileName={targetFileName}
          setTargetFileName={setTargetFileName}
          onGenerate={handleGenerate}
        />

        <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
            Close
          </button>
          {generatedRules && (
            <button
              onClick={handleSaveToFile}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <Download size={13} />
              <span>Apply & Save {targetFileName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
