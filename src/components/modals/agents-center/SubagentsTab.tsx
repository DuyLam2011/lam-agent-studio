import React, { useState } from 'react';
import { Plus, Bot, Search, Sparkles, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { SubagentCard } from './SubagentCard';
import { SubagentPersona } from '../../../types/subagents';
import { ScopeAccordion } from './ScopeAccordion';

export const SubagentsTab: React.FC = () => {
  const { currentRuleScope, systemContext, subagentPersonas, openCreateAgentModal, setImportModalOpen } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const repoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (s: SubagentPersona) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.systemPrompt.toLowerCase().includes(q) || s.model.toLowerCase().includes(q);
  };

  const globalSubagents = subagentPersonas.filter(s => s.scope === 'global' && filterItem(s));
  const workspaceSubagents = subagentPersonas.filter(s => s.scope === 'workspace' && (!activeWs || s.targetId === activeWs.id) && filterItem(s));
  const repoSubagents = subagentPersonas.filter(s => s.scope === 'repo' && (!currentRuleScope.repoPath || s.targetId === currentRuleScope.repoPath) && filterItem(s));

  const handleCreateSubagent = () => {
    openCreateAgentModal();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={15} className="text-pink-400" />
            <h3 className="text-sm font-semibold text-gray-200">Subagent Swarm Personas</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
            Specialized personas across Global (overridable), Workspace (enforced), and Repo scopes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={13} className="text-purple-300" />
            <span>Import Persona</span>
          </button>
          <button
            onClick={handleCreateSubagent}
            className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus size={13} />
            <span>New Subagent</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center gap-2">
        <Search size={13} className="text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter personas by name, role, system prompt, or model..."
          className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {subagentPersonas.length === 0 && (
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center space-y-2">
            <Bot size={24} className="text-cyan-400 mx-auto" />
            <h4 className="text-xs font-bold text-white">No Custom Agents Configured</h4>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              No clutter or dummy personas. Click "+ New Subagent" above to create an agent with your preferred Gemini model!
            </p>
          </div>
        )}

        <ScopeAccordion
          title="Global Subagents"
          subtitle={targetScopeId ? "Inherited baseline (Toggle switch to exclude for this target)" : "Available across all workspaces"}
          icon={Globe}
          iconColor="text-cyan-400"
          badgeCount={globalSubagents.length}
          badgeColor="cyan"
          isOpen={openSections.global}
          onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}
          emptyMessage="No global personas configured."
        >
          {globalSubagents.map(s => <SubagentCard key={s.id} subagent={s} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Workspace Personas"
            subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'}
            icon={Folder}
            iconColor="text-purple-400"
            badgeCount={workspaceSubagents.length}
            badgeColor="purple"
            isOpen={openSections.workspace}
            onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))}
            emptyMessage="No workspace personas configured."
          >
            {workspaceSubagents.map(s => <SubagentCard key={s.id} subagent={s} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Repository Specialist Agents"
            subtitle={repoName ? `Repo: ${repoName} (Git Enforced)` : 'All repositories (Git Enforced)'}
            icon={GitBranch}
            iconColor="text-amber-400"
            badgeCount={repoSubagents.length}
            badgeColor="amber"
            isOpen={openSections.repo}
            onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))}
            emptyMessage="No repository personas configured."
          >
            {repoSubagents.map(s => <SubagentCard key={s.id} subagent={s} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}
      </div>
    </div>
  );
};
