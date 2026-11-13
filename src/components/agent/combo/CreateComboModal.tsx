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
    if (!name.trim()) return addToast('Vui lòng nhập tên cho Agent Combo', 'error');
    if (selectedSubagentIds.length === 0) return addToast('Chọn ít nhất một subagent cho combo này', 'error');

    const newCombo: AgentCombo = {
      id: editingCombo?.id || `combo-custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Tổ hợp subagent tùy chỉnh cho quy trình làm việc.',
      icon: editingCombo?.icon || 'Layers',
      subagentIds: selectedSubagentIds,
      flowType,
      steps: selectedSubagentIds.map((sid, idx) => ({
        id: `step-${idx}-${sid}`,
        subagentId: sid,
        stepName: `Bước ${idx + 1}: ${sid.replace(/^subagent-/, '')}`,
        objective: 'Thực thi vai trò chuyên biệt và đảm bảo tính ổn định trong chuỗi tác vụ.'
      })),
      recommendedSkills: editingCombo?.recommendedSkills || ['code_review'],
      scope: 'global',
      isBuiltin: false,
      updatedAt: Date.now()
    };

    saveAgentCombo(newCombo);
    addToast(`Đã lưu Agent Combo: "${newCombo.name}"`, 'success');
    setCreateComboModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[660px] surface-modal rounded-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-gray-100">{editingCombo ? 'Chỉnh Sửa Agent Combo' : 'Tạo Mới Agent Combo'}</h3>
          </div>
          <button onClick={() => setCreateComboModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-200">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Tên Combo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Fullstack Microservice & Security Combo"
              className="w-full px-3 py-1.5 rounded-lg surface-input border border-border text-xs text-gray-100 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-300 block mb-1">Mô tả mục tiêu</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu và quy trình phối hợp của nhóm tác tử này..."
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
            Hủy bỏ
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md transition-colors">
            <Save size={13} /> <span>Lưu Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
