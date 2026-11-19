import React, { useState } from 'react';
import { Plus, Brain, Search, Sparkles, Globe, Folder, GitBranch, HardDrive, LayoutGrid } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { MemoryCard } from './MemoryCard';
import { EditMemoryModal } from './EditMemoryModal';
import { MemoryFolderTreeView } from './MemoryFolderTreeView';
import { ProjectMemoryItem } from '../../../types/memory';
import { ScopeAccordion } from './ScopeAccordion';
import clsx from 'clsx';

const CATS = ['all', 'decision', 'architecture', 'convention', 'gotcha', 'glossary'] as const;

export const MemoryTab: React.FC = () => {
  const { currentRuleScope, systemContext, projectMemories, setImportModalOpen } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');
  const [editingMemory, setEditingMemory] = useState<ProjectMemoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (m: ProjectMemoryItem) => {
    if (selectedCat !== 'all' && m.category !== selectedCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const inTags = m.tags?.some(t => t.toLowerCase().includes(q)) ?? false;
    return m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || inTags;
  };

  const globalMemories = projectMemories.filter(m => m.scope === 'global' && filterItem(m));
  const workspaceMemories = projectMemories.filter(m => m.scope === 'workspace' && (!activeWs || m.targetId === activeWs.id) && filterItem(m));
  const repoMemories = projectMemories.filter(m => m.scope === 'repo' && (!currentRuleScope.repoPath || m.targetId === currentRuleScope.repoPath) && filterItem(m));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      <div className="p-4 surface-header flex items-center justify-between gap-4 shrink-0 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-gray-200">Memory & Architectural Decisions (ADR)</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono flex items-center gap-1">
              <HardDrive size={10} /> .agents/memory/
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Dual-mode storage: Structured Markdown files on disk + Instant AST Graph linkage.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-black/30 p-0.5 rounded-xl border border-white/10">
            <button onClick={() => setViewMode('cards')} className={clsx("p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all", viewMode === 'cards' ? "bg-white/15 text-white" : "text-gray-400 hover:text-white")} title="Cards View">
              <LayoutGrid size={13} />
            </button>
            <button onClick={() => setViewMode('tree')} className={clsx("p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all", viewMode === 'tree' ? "bg-white/15 text-white" : "text-gray-400 hover:text-white")} title="Disk File Tree View">
              <HardDrive size={13} />
            </button>
          </div>
          <button onClick={() => setImportModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <Sparkles size={13} className="text-purple-300" /><span>Import ADR</span>
          </button>
          <button onClick={() => { setEditingMemory(null); setIsModalOpen(true); }} className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <Plus size={13} /><span>New Memory</span>
          </button>
        </div>
      </div>

      {viewMode === 'cards' && (
        <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1">
            {CATS.map((cat) => (
              <button key={cat} onClick={() => setSelectedCat(cat)} className={clsx("px-2 py-0.5 rounded-lg text-[10px] font-medium uppercase transition-colors", selectedCat === cat ? "bg-white/15 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5")}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 w-60">
            <Search size={12} className="text-gray-500 shrink-0" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search memories, tags..." className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {viewMode === 'tree' ? (
          <MemoryFolderTreeView />
        ) : (
          <>
            <ScopeAccordion title="Global Memory & Conventions" subtitle={targetScopeId ? "Inherited baseline (Toggle to unpin here)" : "Applies across all projects"} icon={Globe} iconColor="text-cyan-400" badgeCount={globalMemories.length} badgeColor="cyan" isOpen={openSections.global} onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))} emptyMessage="No global memories configured.">
              {globalMemories.map(m => <MemoryCard key={m.id} memory={m} currentScopeTargetId={targetScopeId} onEdit={(item) => { setEditingMemory(item); setIsModalOpen(true); }} />)}
            </ScopeAccordion>

            {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
              <ScopeAccordion title="Workspace Decisions (.agents/memory/)" subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'} icon={Folder} iconColor="text-purple-400" badgeCount={workspaceMemories.length} badgeColor="purple" isOpen={openSections.workspace} onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))} emptyMessage="No workspace decisions recorded.">
                {workspaceMemories.map(m => <MemoryCard key={m.id} memory={m} currentScopeTargetId={targetScopeId} onEdit={(item) => { setEditingMemory(item); setIsModalOpen(true); }} />)}
              </ScopeAccordion>
            )}

            {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
              <ScopeAccordion title="Repository Knowledge Base" subtitle={currentRuleScope.repoPath?.split(/[/\\]/).pop() || 'All repositories'} icon={GitBranch} iconColor="text-amber-400" badgeCount={repoMemories.length} badgeColor="amber" isOpen={openSections.repo} onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))} emptyMessage="No repository decisions recorded.">
                {repoMemories.map(m => <MemoryCard key={m.id} memory={m} currentScopeTargetId={targetScopeId} onEdit={(item) => { setEditingMemory(item); setIsModalOpen(true); }} />)}
              </ScopeAccordion>
            )}
          </>
        )}
      </div>

      <EditMemoryModal memory={editingMemory} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingMemory(null); }} />
    </div>
  );
};
