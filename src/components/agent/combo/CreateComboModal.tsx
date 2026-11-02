import React, { useState, useEffect } from 'react';
import { X, Layers, Save } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentCombo, AgentComboFlowType } from '../../../types/agent-combo';
import { ComboSubagentPicker } from './ComboSubagentPicker';
import clsx from 'clsx';

export const CreateComboModal: React.FC = () => {
  const { isCreateComboModalOpen, setCreateComboModalOpen, editingCombo, saveAgentCombo, subagentPersonas, addToast } = useAgentStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [flowType, setFlowType] = useState<AgentComboFlowType>('sequential_pipeline');
  const [selectedSubagentIds, setSelectedSubagentIds] = useState<string[]>([]);

  useEffect(() => {
    if (editingCombo) {
      setName(editingCombo.name);
      setDescription(editingCombo.description);
      setFlowType(editingCombo.flowType);
      setSelectedSubagentIds(editingCombo.subagentIds || []);
    } else {
      setName('');
      setDescription('');
      setFlowType('sequential_pipeline');
      setSelectedSubagentIds(['subagent-backend-reviewer', 'subagent-qa-reviewer']);
    }
  }, [editingCombo, isCreateComboModalOpen]);

  if (!isCreateComboModalOpen) return null;

  const toggleSubagent = (id: string) => {
    setSelectedSubagentIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return addToast('Please provide a name for the combo', 'error');
    if (selectedSubagentIds.length === 0) return addToast('Select at least one subagent for this combo', 'error');

    const newCombo: AgentCombo = {
      id: editingCombo?.id || `combo-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom curated subagent ensemble.',
      icon: 'Layers',
      subagentIds: selectedSubagentIds,
      flowType,
      steps: selectedSubagentIds.map((sid, idx) => ({
        id: `step-${idx}-${sid}`,
        subagentId: sid,
        stepName: `Step ${idx + 1}: ${sid.replace(/^subagent-/, '')}`,
        objective: 'Execute specialized role auditing and verify stability.'
      })),
      recommendedSkills: ['code_review'],
      scope: 'global',
      isBuiltin: false,
      updatedAt: Date.now()
    };

    saveAgentCombo(newCombo);
    addToast(`Saved Agent Combo: "${newCombo.name}"`, 'success');
    setCreateComboModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[600px] surface-modal rounded-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-gray-100">{editingCombo ? 'Edit Agent Combo' : 'New Agent Combo'}</h3>
          </div>
          <button onClick={() => setCreateComboModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-200"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar max-h-[70vh]">
          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Combo Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Backend API Microservice Combo"
              className="w-full px-3 py-1.5 rounded-lg surface-input border border-border text-xs text-gray-100 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the objective and workflow of this ensemble..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg surface-input border border-border text-xs text-gray-100 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Execution Flow</label>
            <div className="grid grid-cols-3 gap-2">
              {(['sequential_pipeline', 'parallel_swarm', 'lead_delegation'] as AgentComboFlowType[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFlowType(f)}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-lg border text-[10px] font-medium capitalize transition-all",
                    flowType === f ? "bg-primary/20 border-primary/40 text-primary font-semibold" : "surface-card border-white/5 text-gray-400 hover:text-gray-200"
                  )}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1.5">
              Select Subagent Ensemble ({selectedSubagentIds.length} selected)
            </label>
            <ComboSubagentPicker subagents={subagentPersonas} selectedIds={selectedSubagentIds} onToggle={toggleSubagent} />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2 bg-white/[0.02]">
          <button onClick={() => setCreateComboModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md transition-colors">
            <Save size={13} /> <span>Save Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
