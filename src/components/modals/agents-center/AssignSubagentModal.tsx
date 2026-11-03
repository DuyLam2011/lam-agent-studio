import React, { useState, useEffect } from 'react';
import { Bot, X, Save } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentClassType, AGENT_CLASS_REGISTRY } from '../../../types/agent-class';
import { matchSkillsAndRulesForClass } from '../../../services/agent-classes/agentClassRouter';
import { SubagentClassSection } from './subagent-assign/SubagentClassSection';
import { SubagentSkillsSection } from './subagent-assign/SubagentSkillsSection';
import { SubagentRulesSection } from './subagent-assign/SubagentRulesSection';
import { QuickCreateSkillModal } from './subagent-assign/QuickCreateSkillModal';
import { QuickCreateRuleModal } from './subagent-assign/QuickCreateRuleModal';

export const AssignSubagentModal: React.FC = () => {
  const { assigningSubagent, setAssigningSubagent, updateSubagent, addToast, agentSkills, agentRules } = useAgentStore();
  const [activeTab, setActiveTab] = useState<'class' | 'skills' | 'rules'>('class');
  const [selectedClass, setSelectedClass] = useState<AgentClassType>('executor');
  const [assignedSkills, setAssignedSkills] = useState<string[]>([]);
  const [assignedRules, setAssignedRules] = useState<string[]>([]);
  const [isCreateSkillOpen, setIsCreateSkillOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);

  useEffect(() => {
    if (!assigningSubagent) return;
    setSelectedClass(assigningSubagent.agentClass || 'executor');
    setAssignedSkills(assigningSubagent.allowedSkills || []);
    setAssignedRules(assigningSubagent.allowedRules || []);
  }, [assigningSubagent]);

  if (!assigningSubagent) return null;

  const rec = matchSkillsAndRulesForClass(selectedClass, agentSkills.map((s) => s.folderName), agentRules.map((r) => r.id));

  const applyClassDefaults = () => {
    setAssignedSkills(rec.recommendedSkills);
    setAssignedRules(rec.matchedRules);
    addToast(`Applied recommended skills & rules for ${selectedClass}`, 'info');
  };

  const handleSave = () => {
    updateSubagent(assigningSubagent.id, {
      agentClass: selectedClass,
      allowedSkills: assignedSkills,
      allowedRules: assignedRules,
      targetCapabilities: AGENT_CLASS_REGISTRY[selectedClass]?.targetCapabilities || assigningSubagent.targetCapabilities,
    });
    addToast(`Saved class, skills & rules for ${assigningSubagent.name}`, 'success');
    setAssigningSubagent(null);
  };

  return (
    <div onClick={() => setAssigningSubagent(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl surface-modal rounded-3xl overflow-hidden flex flex-col border border-subtle shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle surface-header shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
              <Bot size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-app-text uppercase tracking-wider">{assigningSubagent.name}</h3>
                <span className="text-[10px] text-app-muted">({assigningSubagent.role})</span>
              </div>
              <p className="text-[10px] text-app-sub">Assign specialization class, available skills, and execution rules</p>
            </div>
          </div>
          <button onClick={() => setAssigningSubagent(null)} className="p-1 rounded-lg text-app-sub hover:text-app-text hover:bg-white/10">
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 py-2 border-b border-subtle surface-card">
          {(['class', 'skills', 'rules'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-app-sub hover:text-app-text'
              }`}
            >
              {tab === 'class' ? '1. Agent Class' : tab === 'skills' ? `2. Skills (${assignedSkills.length})` : `3. Rules (${assignedRules.length})`}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'class' && (
            <SubagentClassSection selectedClass={selectedClass} onSelectClass={setSelectedClass} onApplyClassDefaults={applyClassDefaults} />
          )}
          {activeTab === 'skills' && (
            <SubagentSkillsSection
              assignedSkills={assignedSkills}
              onToggleSkill={(sk) => setAssignedSkills((s) => (s.includes(sk) ? s.filter((x) => x !== sk) : [...s, sk]))}
              onSelectAll={() => setAssignedSkills(agentSkills.map((s) => s.folderName))}
              onClearAll={() => setAssignedSkills([])}
              onSelectRecommended={() => setAssignedSkills(rec.recommendedSkills)}
              recommendedSkills={rec.recommendedSkills}
              onOpenCreateModal={() => setIsCreateSkillOpen(true)}
            />
          )}
          {activeTab === 'rules' && (
            <SubagentRulesSection
              assignedRules={assignedRules}
              onToggleRule={(rId) => setAssignedRules((r) => (r.includes(rId) ? r.filter((x) => x !== rId) : [...r, rId]))}
              onSelectAll={() => setAssignedRules(agentRules.map((r) => r.id))}
              onClearAll={() => setAssignedRules([])}
              onSelectRecommended={() => setAssignedRules(rec.matchedRules)}
              recommendedRules={rec.matchedRules}
              onOpenCreateModal={() => setIsCreateRuleOpen(true)}
            />
          )}
        </div>

        <div className="px-5 py-3 border-t border-subtle surface-header flex items-center justify-between shrink-0">
          <div className="text-[11px] text-app-sub">
            Assigned: <span className="text-primary font-semibold capitalize">{selectedClass}</span> • <span className="text-cyan-400">{assignedSkills.length} skills</span> • <span className="text-purple-400">{assignedRules.length} rules</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAssigningSubagent(null)} className="px-3 py-1.5 rounded-xl text-xs text-app-sub hover:text-app-text">Cancel</button>
            <button onClick={handleSave} className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-[var(--primary-contrast,#ffffff)] font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95">
              <Save size={13} /> Save Assignments
            </button>
          </div>
        </div>
      </div>

      <QuickCreateSkillModal
        isOpen={isCreateSkillOpen} onClose={() => setIsCreateSkillOpen(false)}
        subagentName={assigningSubagent.name} agentClass={selectedClass}
        onSkillCreated={(folder) => setAssignedSkills((prev) => Array.from(new Set([...prev, folder])))}
      />
      <QuickCreateRuleModal
        isOpen={isCreateRuleOpen} onClose={() => setIsCreateRuleOpen(false)}
        subagentName={assigningSubagent.name} agentClass={selectedClass}
        onRuleCreated={(rId) => setAssignedRules((prev) => Array.from(new Set([...prev, rId])))}
      />
    </div>
  );
};
