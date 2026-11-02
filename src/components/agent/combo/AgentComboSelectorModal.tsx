import React, { useState } from 'react';
import { X, Layers, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { resolveWorkspaceRepoInfo } from '../../../services/workspaceRepoResolver';
import { AgentComboCard } from './AgentComboCard';
import type { WorkspaceComboAuditResult } from '../../../services/workspaceComboAuditorService';

export const AgentComboSelectorModal: React.FC = () => {
  const {
    isComboModalOpen,
    setComboModalOpen,
    agentCombos,
    activeComboId,
    setActiveCombo,
    bindComboToScope,
    systemContext,
    setCreateComboModalOpen,
    deleteAgentCombo,
    auditWorkspaceForCombo,
    addToast
  } = useAgentStore();

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<WorkspaceComboAuditResult | null>(null);

  if (!isComboModalOpen) return null;

  const activeWs = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const repoPath = activeWs?.folders?.[0];
  const repoInfo = resolveWorkspaceRepoInfo(repoPath || '', systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);

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

  const handleAutoAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditWorkspaceForCombo(activeWs?.id, repoPath);
      setAuditResult(res);
    } catch {
      addToast('Không thể quét và phân tích workspace', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[880px] max-h-[85vh] surface-modal rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <span>Agent Combos (Ensemble Teams)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-mono">
                  {repoInfo.formattedTag}
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Curated subagent clusters and execution pipelines optimized for specific project architectures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoAudit}
              disabled={isAuditing}
              title="Chạy AI Agent quét kho mã nguồn và đề xuất Combo chuẩn xác nhất cho workspace"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-200 text-xs font-medium transition-colors"
            >
              {isAuditing ? <Loader2 size={13} className="animate-spin text-cyan-400" /> : <Sparkles size={13} className="text-cyan-400" />}
              <span>Gợi ý Combo</span>
            </button>
            <button
              onClick={() => setCreateComboModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Plus size={13} />
              <span>Create Combo</span>
            </button>
            <button
              onClick={() => setComboModalOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Audit Recommendation Banner if run */}
        {auditResult && (
          <div className="px-5 py-2.5 bg-cyan-950/30 border-b border-cyan-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-400 shrink-0" />
              <span className="text-gray-300">
                Khuyến nghị: <strong className="text-white">{auditResult.recommendedComboName}</strong> (Độ tin cậy: {(auditResult.confidence * 100).toFixed(0)}%)
              </span>
              <span className="text-gray-400 hidden md:inline">· {auditResult.detectedSignals.join(', ')}</span>
            </div>
            <button
              onClick={() => handleSelectForRepo(auditResult.recommendedComboId)}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] shrink-0 transition-colors"
            >
              Áp dụng
            </button>
          </div>
        )}

        {/* Combo Cards Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {agentCombos.map((combo) => (
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
    </div>
  );
};