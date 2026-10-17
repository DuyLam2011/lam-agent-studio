import React, { useState } from 'react';
import { Plus, Brain, Search, Sparkles, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { MemoryCard } from './MemoryCard';
import { ProjectMemoryItem, MemoryCategory } from '../../../types/memory';
import { ScopeAccordion } from './ScopeAccordion';
import clsx from 'clsx';

const CATS = ['all', 'decision', 'architecture', 'convention', 'gotcha', 'glossary'] as const;

export const MemoryTab: React.FC = () => {
  const { currentRuleScope, systemContext, projectMemories, addMemory, addToast, setImportModalOpen } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const repoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (m: ProjectMemoryItem) => {
    if (selectedCat !== 'all' && m.category !== selectedCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
  };

  const globalMemories = projectMemories.filter(m => m.scope === 'global' && filterItem(m));
  const workspaceMemories = projectMemories.filter(m => m.scope === 'workspace' && (!activeWs || m.targetId === activeWs.id) && filterItem(m));
  const repoMemories = projectMemories.filter(m => m.scope === 'repo' && (!currentRuleScope.repoPath || m.targetId === currentRuleScope.repoPath) && filterItem(m));

  const handleCreateMemory = () => {
    const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : currentRuleScope.type === 'repo' ? 'repo' : 'global';
    const newMemory: ProjectMemoryItem = {
      id: `memory-${Date.now()}`,
      title: 'Architectural Convention / Lesson',
      category: (selectedCat !== 'all' ? selectedCat : 'decision') as MemoryCategory,
      content: 'Explicit convention or decision recorded for agent guidance. Mention specific constraints and rationales.',
      scope: targetScope,
      targetId: targetScope === 'workspace' ? currentRuleScope.workspaceId : (targetScope === 'repo' ? currentRuleScope.repoPath : undefined),
      pinned: true,
      updatedAt: Date.now()
    };
    addMemory(newMemory);
    addToast('Recorded new project memory item', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2"><Brain size={15} className="text-amber-400" /><h3 className="text-sm font-semibold text-gray-200">Project Memory & Architectural Decisions (ADR)</h3></div>
          <p className="text-xs text-gray-400 mt-0.5">Persistent knowledge base across Global (overridable), Workspace (enforced), and Repo scopes.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setImportModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all">
            <Sparkles size={13} className="text-purple-300" /><span>Import ADR</span>
          </button>
          <button onClick={handleCreateMemory} className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all">
            <Plus size={13} /><span>New Memory</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {CATS.map((cat) => (
            <button key={cat} onClick={() => setSelectedCat(cat)} className={clsx("px-2 py-0.5 rounded-lg text-[10px] font-medium uppercase transition-colors", selectedCat === cat ? "bg-white/15 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5")}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 w-60">
          <Search size={12} className="text-gray-500 shrink-0" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search memories..." className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <ScopeAccordion title="Global Memory & Conventions" subtitle={targetScopeId ? "Inherited baseline (Toggle to unpin here)" : "Applies across all projects"} icon={Globe} iconColor="text-cyan-400" badgeCount={globalMemories.length} badgeColor="cyan" isOpen={openSections.global} onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))} emptyMessage="No global memories configured.">
          {globalMemories.map(m => <MemoryCard key={m.id} memory={m} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion title="Workspace Decisions" subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'} icon={Folder} iconColor="text-purple-400" badgeCount={workspaceMemories.length} badgeColor="purple" isOpen={openSections.workspace} onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))} emptyMessage="No workspace decisions recorded.">
            {workspaceMemories.map(m => <MemoryCard key={m.id} memory={m} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion title="Repository Knowledge Base" subtitle={repoName ? `Repo: ${repoName} (Git Enforced)` : 'All repositories (Git Enforced)'} icon={GitBranch} iconColor="text-amber-400" badgeCount={repoMemories.length} badgeColor="amber" isOpen={openSections.repo} onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))} emptyMessage="No repository decisions recorded.">
            {repoMemories.map(m => <MemoryCard key={m.id} memory={m} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}
      </div>
    </div>
  );
};
