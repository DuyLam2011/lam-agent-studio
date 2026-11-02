import React, { useState } from 'react';
import { Plus, Bot, Search, Sparkles, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { SubagentCard } from './SubagentCard';
import { SubagentPersona } from '../../../types/subagents';
import { AgentClassType } from '../../../types/agent-class';
import { AgentClassFilterBar } from './AgentClassFilterBar';
import { ScopeAccordion } from './ScopeAccordion';
import { AssignSubagentModal } from './AssignSubagentModal';
import { FatherAgentProfileCard } from './FatherAgentProfileCard';
import { AgentProfileTuneModal } from './AgentProfileTuneModal';
import { serializeCloudProfilesPayload } from '../../../services/agent-profile/agentProfileStorageService';

export const SubagentsTab: React.FC = () => {
  const {
    currentRuleScope, systemContext, subagentPersonas, openCreateAgentModal, setImportModalOpen,
    getAgentProfile, updateAgentProfile, tuningAgentProfile, setTuningAgentProfile, addToast, agentProfiles
  } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<AgentClassType | 'all'>('all');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const fatherProfile = getAgentProfile('father-agent');

  const handleExportCloud = () => {
    const payload = serializeCloudProfilesPayload(agentProfiles);
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    addToast('Đã sao chép cấu hình Cloud Profiles JSON vào clipboard!', 'success');
  };

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const repoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (s: SubagentPersona) => {
    if (selectedClass !== 'all' && s.agentClass !== selectedClass) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.systemPrompt.toLowerCase().includes(q) || s.model.toLowerCase().includes(q);
  };

  const counts: Record<AgentClassType | 'all', number> = {
    all: subagentPersonas.length,
    architecture: subagentPersonas.filter(s => s.agentClass === 'architecture').length,
    planner: subagentPersonas.filter(s => s.agentClass === 'planner').length,
    executor: subagentPersonas.filter(s => s.agentClass === 'executor').length,
  };

  const globalSubs = subagentPersonas.filter(s => s.scope === 'global' && filterItem(s));
  const wsSubs = subagentPersonas.filter(s => s.scope === 'workspace' && (!activeWs || s.targetId === activeWs.id) && filterItem(s));
  const repoSubs = subagentPersonas.filter(s => s.scope === 'repo' && (!currentRuleScope.repoPath || s.targetId === currentRuleScope.repoPath) && filterItem(s));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      <div className="p-4 surface-header flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-app-text">Subagent Swarm Personas</h3>
          </div>
          <p className="text-xs text-muted mt-0.5 max-w-xl">
            Class-based agent specialization (Architecture, Planner, Executor) orchestrated by Father Agent.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setImportModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md">
            <Sparkles size={13} className="text-purple-300" /> <span>Import</span>
          </button>
          <button onClick={() => openCreateAgentModal()} className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md">
            <Plus size={13} /> <span>New Subagent</span>
          </button>
        </div>
      </div>

      <AgentClassFilterBar selectedClass={selectedClass} onSelectClass={setSelectedClass} counts={counts} />

      <div className="px-4 py-2 border-b border-subtle surface-input flex items-center gap-2">
        <Search size={13} className="text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter personas by name, role, system prompt, or model..."
          className="bg-transparent text-xs text-app-text placeholder:text-muted focus:outline-none w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {/* Father Agent Master Profile Card */}
        <FatherAgentProfileCard profile={fatherProfile} onOpenTune={() => setTuningAgentProfile(fatherProfile)} onExportCloud={handleExportCloud} />

        <ScopeAccordion
          title="Global Subagents"
          subtitle={targetScopeId ? "Inherited baseline" : "Available across all workspaces"}
          icon={Globe}
          iconColor="text-cyan-400"
          badgeCount={globalSubs.length}
          badgeColor="cyan"
          isOpen={openSections.global}
          onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}
          emptyMessage="No global personas matching filter."
        >
          {globalSubs.map(s => <SubagentCard key={s.id} subagent={s} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>

        <ScopeAccordion
          title="Workspace Personas"
          subtitle={activeWs ? `Workspace: ${activeWs.name}` : 'Workspace scope'}
          icon={Folder}
          iconColor="text-purple-400"
          badgeCount={wsSubs.length}
          badgeColor="purple"
          isOpen={openSections.workspace}
          onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))}
          emptyMessage="No workspace personas matching filter."
        >
          {wsSubs.map(s => <SubagentCard key={s.id} subagent={s} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>

        <ScopeAccordion
          title="Repository Specialist Agents"
          subtitle={repoName ? `Repo: ${repoName}` : 'Repo scope'}
          icon={GitBranch}
          iconColor="text-amber-400"
          badgeCount={repoSubs.length}
          badgeColor="amber"
          isOpen={openSections.repo}
          onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))}
          emptyMessage="No repository personas matching filter."
        >
          {repoSubs.map(s => <SubagentCard key={s.id} subagent={s} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>
      </div>

      <AssignSubagentModal />
      <AgentProfileTuneModal
        profile={tuningAgentProfile}
        isOpen={Boolean(tuningAgentProfile)}
        onClose={() => setTuningAgentProfile(null)}
        onSave={(upd) => { updateAgentProfile(upd.agentId, upd); addToast(`Đã lưu profile ${upd.name}`, 'success'); }}
      />
    </div>
  );
};
