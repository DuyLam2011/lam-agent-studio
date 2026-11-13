import React, { useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentComboCard } from '../../agent/combo/AgentComboCard';
import { resolveWorkspaceRepoInfo } from '../../../services/workspace/workspaceRepoResolver';
import { AgentCombo, AgentComboFlowType } from '../../../types/agent-combo';
import clsx from 'clsx';

export const CombosTab: React.FC = () => {
  const {
    agentCombos,
    activeComboId,
    repoComboBindings,
    setActiveCombo,
    bindComboToScope,
    systemContext,
    setCreateComboModalOpen,
    deleteAgentCombo,
    addToast
  } = useAgentStore();

  const [search, setSearch] = useState('');
  const [selectedFlow, setSelectedFlow] = useState<AgentComboFlowType | 'all'>('all');

  const activeWs = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const repoPath = activeWs?.folders?.[0];
  const repoInfo = resolveWorkspaceRepoInfo(repoPath || '', systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);

  const filtered = agentCombos.filter((c) => {
    if (selectedFlow !== 'all' && c.flowType !== selectedFlow) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const handleSelectForRepo = (comboId: string) => {
    setActiveCombo(comboId, repoInfo.formattedTag);
    bindComboToScope(repoInfo.formattedTag, comboId);
    if (repoPath) bindComboToScope(repoPath, comboId);
    const selected = agentCombos.find((c) => c.id === comboId);
    addToast(`Đã áp dụng combo "${selected?.name || comboId}" cho ${repoInfo.formattedTag}`, 'success');
  };

  const handleSelectGlobal = (comboId: string) => {
    setActiveCombo(comboId);
    const selected = agentCombos.find((c) => c.id === comboId);
    addToast(`Đã chọn "${selected?.name || comboId}" làm mặc định toàn cục`, 'info');
  };

  const handleCloneCombo = (combo: AgentCombo) => {
    setCreateComboModalOpen(true, {
      ...combo,
      id: `combo-custom-${Date.now()}`,
      name: `${combo.name} (Tùy biến)`,
      isBuiltin: false
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      {/* Header */}
      <div className="p-4 surface-header flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-primary" />
            <h3 className="text-sm font-semibold text-gray-200">Agent Combos & Ensembles</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
              {repoInfo.formattedTag}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
            Tổ chức và điều phối các nhóm chuyên gia subagent theo luồng tuần tự, song song hoặc phân quyền DAG.
          </p>
        </div>

        <button
          onClick={() => setCreateComboModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
        >
          <Plus size={13} />
          <span>Tạo Combo</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={13} className="text-gray-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lọc combo theo tên hoặc mô tả..."
            className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(['all', 'sequential_pipeline', 'parallel_swarm', 'lead_delegation'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFlow(type)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                selectedFlow === type
                  ? "bg-primary/20 text-primary border border-primary/30 font-semibold"
                  : "text-gray-400 hover:text-gray-200 border border-transparent"
              )}
            >
              {type === 'all' ? 'Tất cả' : type === 'sequential_pipeline' ? 'Pipeline' : type === 'parallel_swarm' ? 'Swarm' : 'Lead DAG'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((combo) => {
            const isBound = repoComboBindings[repoInfo.formattedTag] === combo.id || (repoPath ? repoComboBindings[repoPath] === combo.id : false);
            return (
              <AgentComboCard
                key={combo.id}
                combo={combo}
                isActive={combo.id === activeComboId}
                isRepoBound={isBound}
                repoTag={repoInfo.formattedTag}
                onSelectForRepo={handleSelectForRepo}
                onSelectGlobal={handleSelectGlobal}
                onEdit={(c) => setCreateComboModalOpen(true, c)}
                onClone={handleCloneCombo}
                onDelete={(id) => deleteAgentCombo(id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
