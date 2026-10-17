import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentSkill, AiSkillRecommendation } from '../../../types/skills';
import { AiSkillConsultantBody } from './AiSkillConsultantBody';
import { consultAiForSkills } from './aiSkillConsultantHelper';

interface AiSkillConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSkillConsultantModal: React.FC<AiSkillConsultantModalProps> = ({ isOpen, onClose }) => {
  const { systemContext, currentRuleScope, addSkill, addToast, engineSettings, agentSkills } = useAgentStore();
  const [isConsulting, setIsConsulting] = useState(false);
  const [recommendations, setRecommendations] = useState<AiSkillRecommendation[]>([]);

  if (!isOpen) return null;

  const currentWorkspace = systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId) || systemContext.workspaces[0];
  const targetRepoPath = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : currentWorkspace?.folders?.[0];

  const handleConsult = async () => {
    setIsConsulting(true);
    setRecommendations([]);
    try {
      const skills = await consultAiForSkills(targetRepoPath, currentWorkspace?.name, engineSettings.selectedModel);
      setRecommendations(skills);
      addToast('AI Consultant synthesized skill recommendations!', 'success');
    } catch {
      addToast('Failed to consult AI for skills', 'error');
    } finally {
      setIsConsulting(false);
    }
  };

  const handleAdopt = async (rec: AiSkillRecommendation) => {
    try {
      let savedPath: string | undefined;
      if (targetRepoPath) {
        // @ts-ignore
        const res = await window.lamApi?.skills?.saveSkill?.(targetRepoPath, rec.folderName, rec.suggestedContent);
        if (res?.success) savedPath = res.filePath;
      }

      const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
      const skill: AgentSkill = {
        id: `ai-skill-${Date.now()}`,
        name: rec.name,
        folderName: rec.folderName,
        description: rec.description,
        content: rec.suggestedContent,
        scope: targetScope,
        targetId: targetScope === 'repo' ? currentRuleScope.repoPath : (targetScope === 'workspace' ? currentWorkspace?.id : undefined),
        source: 'ai-generated',
        filePath: savedPath,
        category: rec.category,
        active: true,
        updatedAt: Date.now()
      };
      addSkill(skill);
      addToast(`Adopted & installed skill: ${rec.name}`, 'success');
    } catch {
      addToast('Failed to install skill', 'error');
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
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">AI Skill Consultant</h3>
              <p className="text-[10px] text-gray-400">Scans tech stack to formulate tailored agent capabilities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={15} />
          </button>
        </div>

        <AiSkillConsultantBody
          currentScopeType={currentRuleScope.type}
          targetRepoPath={targetRepoPath}
          isConsulting={isConsulting}
          recommendations={recommendations}
          agentSkills={agentSkills}
          onConsult={handleConsult}
          onAdopt={handleAdopt}
        />

        <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
