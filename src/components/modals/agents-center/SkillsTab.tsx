import React, { useState } from 'react';
import { Plus, Sparkles, Wrench, Search, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentSkill } from '../../../types/skills';
import { SkillCard } from './SkillCard';
import { SkillStudioModal } from './skills/SkillStudioModal';
import { SkillDryRunModal } from './skills/SkillDryRunModal';
import { AiSkillConsultantModal } from './AiSkillConsultantModal';
import { ScopeAccordion } from './ScopeAccordion';

export const SkillsTab: React.FC = () => {
  const { currentRuleScope, systemContext, agentSkills, addSkill, addToast } = useAgentStore();
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [testSkill, setTestSkill] = useState<AgentSkill | null>(null);
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

  const handleCloneSkill = (sk: AgentSkill) => {
    const cloneScope = currentRuleScope.type === 'repo' ? 'repo' : (currentRuleScope.type === 'workspace' ? 'workspace' : 'global');
    addSkill({
      ...sk, id: `skill-clone-${Date.now()}`, name: `${sk.name} (Custom)`,
      folderName: `${sk.folderName}_custom`, scope: cloneScope,
      targetId: cloneScope === 'workspace' ? currentRuleScope.workspaceId : (cloneScope === 'repo' ? currentRuleScope.repoPath : undefined),
      source: 'custom', filePath: undefined, updatedAt: Date.now()
    });
    addToast(`Đã nhân bản skill ${sk.name} sang scope ${cloneScope.toUpperCase()}`, 'success');
  };

  const globalSkills = agentSkills.filter(s => s.scope === 'global' && filterItem(s));
  const workspaceSkills = agentSkills.filter(s => s.scope === 'workspace' && (!activeWs || s.targetId === activeWs.id) && filterItem(s));
  const repoSkills = agentSkills.filter(s => s.scope === 'repo' && (!currentRuleScope.repoPath || s.targetId === currentRuleScope.repoPath) && filterItem(s));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent select-none">
      <div className="p-3.5 surface-header flex items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xs font-semibold text-app-text uppercase tracking-wider flex items-center gap-1.5">
            <Wrench size={13} className="text-primary" />
            <span>Agent Capabilities & Skills Studio Matrix</span>
          </h2>
          <p className="text-[10px] text-muted mt-0.5">Global capabilities (overridable), workspace toolchains, and repository skills.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-2.5 text-muted" />
            <input
              type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter skills..."
              className="surface-input border border-subtle rounded-lg pl-7 pr-2 py-1 text-xs text-app-text outline-none w-32 focus:w-44 transition-all"
            />
          </div>
          <button onClick={() => setIsAiConsultantOpen(true)} className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
            <Sparkles size={12} /><span>AI Consultant</span>
          </button>
          <button onClick={() => { setSelectedSkill(null); setIsEditorOpen(true); }} className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
            <Plus size={12} /><span>Skill Studio</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <ScopeAccordion title="Global Skills" subtitle={targetScopeId ? "Inherited baseline (Toggle to exclude)" : "Available across all workspaces"} icon={Globe} iconColor="text-cyan-400" badgeCount={globalSkills.length} badgeColor="cyan" isOpen={openSections.global} onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))} emptyMessage="No global skills configured.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {globalSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={(sk) => { setSelectedSkill(sk); setIsEditorOpen(true); }} onDryRun={(sk) => setTestSkill(sk)} onClone={handleCloneSkill} currentScopeTargetId={targetScopeId} />)}
          </div>
        </ScopeAccordion>

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion title="Workspace Skills" subtitle={activeWs ? `Workspace: ${activeWs.name}` : 'All workspaces'} icon={Folder} iconColor="text-purple-400" badgeCount={workspaceSkills.length} badgeColor="purple" isOpen={openSections.workspace} onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))} emptyMessage="No workspace skills configured.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {workspaceSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={(sk) => { setSelectedSkill(sk); setIsEditorOpen(true); }} onDryRun={(sk) => setTestSkill(sk)} onClone={handleCloneSkill} currentScopeTargetId={targetScopeId} />)}
            </div>
          </ScopeAccordion>
        )}

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion title="Repository Skills" subtitle={currentRepoName ? `Repo: ${currentRepoName}` : 'All repositories'} icon={GitBranch} iconColor="text-amber-400" badgeCount={repoSkills.length} badgeColor="amber" isOpen={openSections.repo} onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))} emptyMessage="No repository skills found in .agents/skills/.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {repoSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={(sk) => { setSelectedSkill(sk); setIsEditorOpen(true); }} onDryRun={(sk) => setTestSkill(sk)} onClone={handleCloneSkill} currentScopeTargetId={targetScopeId} />)}
            </div>
          </ScopeAccordion>
        )}
      </div>

      <SkillStudioModal skill={selectedSkill} isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
      {testSkill && <SkillDryRunModal skill={{ name: testSkill.name, description: testSkill.description, content: testSkill.content }} isOpen={Boolean(testSkill)} onClose={() => setTestSkill(null)} />}
      <AiSkillConsultantModal isOpen={isAiConsultantOpen} onClose={() => setIsAiConsultantOpen(false)} />
    </div>
  );
};
