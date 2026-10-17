import React, { useState } from 'react';
import { Plus, Sparkles, Wrench, Search, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentSkill } from '../../../types/skills';
import { SkillCard } from './SkillCard';
import { SkillEditorModal } from './SkillEditorModal';
import { AiSkillConsultantModal } from './AiSkillConsultantModal';
import { ScopeAccordion } from './ScopeAccordion';

export const SkillsTab: React.FC = () => {
  const { currentRuleScope, systemContext, agentSkills } = useAgentStore();
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAiConsultantOpen, setIsAiConsultantOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const currentRepoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (s: AgentSkill) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.folderName?.toLowerCase().includes(q);
  };

  const globalSkills = agentSkills.filter(s => s.scope === 'global' && filterItem(s));
  const workspaceSkills = agentSkills.filter(s => s.scope === 'workspace' && (!activeWs || s.targetId === activeWs.id) && filterItem(s));
  const repoSkills = agentSkills.filter(s => s.scope === 'repo' && (!currentRuleScope.repoPath || s.targetId === currentRuleScope.repoPath) && filterItem(s));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
      <div className="p-3.5 border-b border-white/10 bg-black/20 flex items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench size={13} className="text-primary" />
            <span>Agent Capabilities & Skills Matrix</span>
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Global capabilities (overridable), workspace toolchains, and repository skills.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter skills..."
              className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-xs text-gray-200 outline-none w-32 focus:w-44 transition-all"
            />
          </div>
          <button
            onClick={() => setIsAiConsultantOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Sparkles size={12} />
            <span>AI Skill Consultant</span>
          </button>
          <button
            onClick={() => { setSelectedSkill(null); setIsEditorOpen(true); }}
            className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus size={12} />
            <span>New Skill</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <ScopeAccordion
          title="Global Skills"
          subtitle={targetScopeId ? "Inherited baseline (Toggle switch to exclude for this target)" : "Available across all workspaces"}
          icon={Globe}
          iconColor="text-cyan-400"
          badgeCount={globalSkills.length}
          badgeColor="cyan"
          isOpen={openSections.global}
          onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}
          emptyMessage="No global skills configured."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {globalSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={(sk) => { setSelectedSkill(sk); setIsEditorOpen(true); }} currentScopeTargetId={targetScopeId} />)}
          </div>
        </ScopeAccordion>

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Workspace Skills"
            subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'}
            icon={Folder}
            iconColor="text-purple-400"
            badgeCount={workspaceSkills.length}
            badgeColor="purple"
            isOpen={openSections.workspace}
            onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))}
            emptyMessage="No workspace skills configured for this workspace."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {workspaceSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={(sk) => { setSelectedSkill(sk); setIsEditorOpen(true); }} currentScopeTargetId={targetScopeId} />)}
            </div>
          </ScopeAccordion>
        )}

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Repository Skills"
            subtitle={currentRepoName ? `Repo: ${currentRepoName} (Git Enforced)` : 'All repositories (Git Enforced)'}
            icon={GitBranch}
            iconColor="text-amber-400"
            badgeCount={repoSkills.length}
            badgeColor="amber"
            isOpen={openSections.repo}
            onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))}
            emptyMessage="No repository skills found in .agents/skills/."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {repoSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={(sk) => { setSelectedSkill(sk); setIsEditorOpen(true); }} currentScopeTargetId={targetScopeId} />)}
            </div>
          </ScopeAccordion>
        )}
      </div>

      <SkillEditorModal skill={selectedSkill} isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
      <AiSkillConsultantModal isOpen={isAiConsultantOpen} onClose={() => setIsAiConsultantOpen(false)} />
    </div>
  );
};
