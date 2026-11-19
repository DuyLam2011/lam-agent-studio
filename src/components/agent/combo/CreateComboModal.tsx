import React, { useState, useEffect } from 'react';
import { X, Layers, Save } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentCombo, AgentComboFlowType } from '../../../types/agent-combo';
import { ComboFlowSelector } from './ComboFlowSelector';
import { ComboSubagentPicker } from './ComboSubagentPicker';

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
    if (!name.trim()) return addToast('Please enter a name for the Agent Combo', 'error');
    if (selectedSubagentIds.length === 0) return addToast('Select at least one subagent for this combo', 'error');

    const newCombo: AgentCombo = {
      id: editingCombo?.id || `combo-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom subagent ensemble for tailored workflows.',
      icon: editingCombo?.icon || 'Layers',
      subagentIds: selectedSubagentIds,
      flowType,
      steps: selectedSubagentIds.map((sid, idx) => ({
        id: `step-${idx}-${sid}`,
        subagentId: sid,
        stepName: `Step ${idx + 1}: ${sid.replace(/^subagent-/, '')}`,
        objective: 'Executes specialized role and ensures invariant compliance.'
      })),
      recommendedSkills: editingCombo?.recommendedSkills || ['code_review'],
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
      <div className="w-[660px] surface-modal rounded-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-gray-100">{editingCombo ? 'Edit Agent Combo' : 'New Agent Combo'}</h3>
          </div>
          <button onClick={() => setCreateComboModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-200">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Combo Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fullstack Microservice & Security Ensemble"
              className="w-full px-3 py-1.5 rounded-lg surface-input border border-border text-xs text-gray-100 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Objective & Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the objective and collaborative workflow for this subagent ensemble..."
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg surface-input border border-border text-xs text-gray-100 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <ComboFlowSelector flowType={flowType} onChange={setFlowType} />

          <ComboSubagentPicker
            subagents={subagentPersonas}
            selectedIds={selectedSubagentIds}
            flowType={flowType}
            onReorder={setSelectedSubagentIds}
            onToggle={toggleSubagent}
          />
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2 bg-white/[0.02] shrink-0">
          <button onClick={() => setCreateComboModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md transition-colors">
            <Save size={13} /> <span>Save Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
