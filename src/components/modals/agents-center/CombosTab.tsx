import React, { useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentComboCard } from '../../agent/combo/AgentComboCard';
import { resolveWorkspaceRepoInfo } from '../../../services/workspaceRepoResolver';

export const CombosTab: React.FC = () => {
  const {
    agentCombos,
    activeComboId,
    setActiveCombo,
    bindComboToScope,
    systemContext,
    setCreateComboModalOpen,
    deleteAgentCombo,
    addToast
  } = useAgentStore();

  const [search, setSearch] = useState('');

  const activeWs = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const repoPath = activeWs?.folders?.[0];
  const repoInfo = resolveWorkspaceRepoInfo(repoPath || '', systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);

  const filtered = agentCombos.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const handleSelectForRepo = (comboId: string) => {
    setActiveCombo(comboId, repoInfo.formattedTag);
    bindComboToScope(repoInfo.formattedTag, comboId);
    if (repoPath) bindComboToScope(repoPath, comboId);
    const selected = agentCombos.find((c) => c.id === comboId);
    addToast(`Activated "${selected?.name || comboId}" for ${repoInfo.formattedTag}`, 'success');
  };

  const handleSelectGlobal = (comboId: string) => {
    setActiveCombo(comboId);
    const selected = agentCombos.find((c) => c.id === comboId);
    addToast(`Set "${selected?.name || comboId}" as default Agent Combo`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      {/* Header */}
      <div className="p-4 surface-header flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-gray-200">Agent Combos & Ensembles</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
            Curate specialized teams of subagents and execution pipelines bound to workspaces or specific repositories.
          </p>
        </div>

        <button
          onClick={() => setCreateComboModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
        >
          <Plus size={13} />
          <span>New Combo</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center gap-2 shrink-0">
        <Search size={13} className="text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter combos by name or description..."
          className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((combo) => (
            <AgentComboCard
              key={combo.id}
              combo={combo}
              isActive={combo.id === activeComboId}
              repoTag={repoInfo.formattedTag}
              onSelectForRepo={handleSelectForRepo}
              onSelectGlobal={handleSelectGlobal}
              onEdit={(c) => setCreateComboModalOpen(true, c)}
              onDelete={(id) => deleteAgentCombo(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
