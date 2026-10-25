import React, { useState } from 'react';
import { Plus, Workflow, Search, Sparkles, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { WorkflowCard } from './WorkflowCard';
import { AgentWorkflowItem } from '../../../types/workflows';
import { ScopeAccordion } from './ScopeAccordion';

export const WorkflowsTab: React.FC = () => {
  const { currentRuleScope, systemContext, agentWorkflows, addWorkflow, addToast, setImportModalOpen, setAutomationModalOpen } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const repoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (wf: AgentWorkflowItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return wf.name.toLowerCase().includes(q) || wf.description.toLowerCase().includes(q) || wf.trigger.toLowerCase().includes(q);
  };

  const globalWfs = agentWorkflows.filter(w => w.scope === 'global' && filterItem(w));
  const workspaceWfs = agentWorkflows.filter(w => w.scope === 'workspace' && (!activeWs || w.targetId === activeWs.id) && filterItem(w));
  const repoWfs = agentWorkflows.filter(w => w.scope === 'repo' && (!currentRuleScope.repoPath || w.targetId === currentRuleScope.repoPath) && filterItem(w));

  const handleCreateWorkflow = () => {
    const isWs = currentRuleScope.type === 'workspace';
    const isRepo = currentRuleScope.type === 'repo';
    addWorkflow({
      id: `workflow-${Date.now()}`,
      name: 'Custom Autonomous Pipeline',
      description: 'Multi-step autonomous agent workflow execution pipeline.',
      trigger: 'manual',
      scope: isWs ? 'workspace' : isRepo ? 'repo' : 'global',
      targetId: isWs ? currentRuleScope.workspaceId : (isRepo ? currentRuleScope.repoPath : undefined),
      active: true,
      steps: [
        { id: 's1', name: 'Analyze Requirements', role: 'architect', instructions: 'Analyze architectural impact.' },
        { id: 's2', name: 'Synthesize Code', role: 'builder', instructions: 'Write modular code (<150 lines).' },
        { id: 's3', name: 'Verification Tests', role: 'qa', instructions: 'Execute tests with zero regressions.' }
      ],
      updatedAt: Date.now()
    });
    addToast('Created new workflow pipeline', 'success');
  };

  const showScoped = currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Workflow size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-gray-200">Autonomous Workflow Pipelines</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
            Phased multi-step pipelines across Global, Workspace, and Repo scopes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutomationModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            title="Open n8n-style Drag-and-Drop Node Studio"
          >
            <Workflow size={13} className="text-cyan-300" />
            <span>Visual Graph</span>
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={13} className="text-purple-300" />
            <span>Import</span>
          </button>
          <button
            onClick={handleCreateWorkflow}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus size={13} />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center gap-2">
        <Search size={13} className="text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter pipelines by name, description, or trigger..."
          className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <ScopeAccordion
          title="Global Workflows"
          subtitle={targetScopeId ? "Inherited baseline" : "Available across all workspaces"}
          icon={Globe}
          iconColor="text-cyan-400"
          badgeCount={globalWfs.length}
          badgeColor="cyan"
          isOpen={openSections.global}
          onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}
          emptyMessage="No global workflows configured."
        >
          {globalWfs.map(wf => <WorkflowCard key={wf.id} workflow={wf} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>

        {showScoped && (
          <ScopeAccordion
            title="Workspace Workflows"
            subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'}
            icon={Folder} iconColor="text-purple-400" badgeCount={workspaceWfs.length} badgeColor="purple"
            isOpen={openSections.workspace} onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))}
            emptyMessage="No workspace workflows configured."
          >
            {workspaceWfs.map(wf => <WorkflowCard key={wf.id} workflow={wf} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}

        {showScoped && (
          <ScopeAccordion
            title="Repository Workflows"
            subtitle={repoName ? `Repo: ${repoName} (Git Enforced)` : 'All repositories (Git Enforced)'}
            icon={GitBranch} iconColor="text-amber-400" badgeCount={repoWfs.length} badgeColor="amber"
            isOpen={openSections.repo} onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))}
            emptyMessage="No repository workflows configured."
          >
            {repoWfs.map(wf => <WorkflowCard key={wf.id} workflow={wf} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}
      </div>
    </div>
  );
};
