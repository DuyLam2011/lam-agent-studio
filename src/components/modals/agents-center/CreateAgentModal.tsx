import React, { useState, useEffect } from 'react';
import { Bot, X, Sparkles, Play, Check } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { SubagentPersona } from '../../../types/subagents';
import { AGENT_PRESET_TEMPLATES, AgentPresetTemplate } from './agentTemplates';
import { AgentFormFields } from './AgentFormFields';
import { runAgentReview } from '../../../services/agentReviewService';

export const CreateAgentModal: React.FC = () => {
  const { isCreateAgentModalOpen, closeCreateAgentModal, createAgentInitialContext, addSubagent, addToast, systemContext, engineSettings } = useAgentStore();
  const defaultTpl = AGENT_PRESET_TEMPLATES[0];

  const [name, setName] = useState(defaultTpl.name);
  const [role, setRole] = useState(defaultTpl.role);
  const [model, setModel] = useState(engineSettings.selectedModel || defaultTpl.model);
  const [reasoningEffort, setReasoningEffort] = useState<SubagentPersona['reasoningEffort']>(defaultTpl.reasoningEffort);
  const [systemPrompt, setSystemPrompt] = useState(defaultTpl.systemPrompt);

  useEffect(() => {
    if (!isCreateAgentModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCreateAgentModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateAgentModalOpen, closeCreateAgentModal]);

  if (!isCreateAgentModalOpen) return null;

  const applyTemplate = (tpl: AgentPresetTemplate) => {
    setName(tpl.name);
    setRole(tpl.role);
    setModel(tpl.model);
    setReasoningEffort(tpl.reasoningEffort);
    setSystemPrompt(tpl.systemPrompt);
    addToast(`Applied template: ${tpl.name}`, 'info');
  };

  const createPersona = (): SubagentPersona => ({
    id: `agent-${Date.now()}`,
    name: name.trim() || 'Custom Agent',
    role: role.trim() || 'Code Specialist',
    systemPrompt: systemPrompt.trim(),
    model,
    temperature: 0.2,
    reasoningEffort,
    allowedSkills: ['code_review'],
    scope: 'global',
    active: true,
    updatedAt: Date.now()
  });

  const handleSaveOnly = () => {
    const newAgent = createPersona();
    addSubagent(newAgent);
    addToast(`Created Agent: ${newAgent.name}`, 'success');
    closeCreateAgentModal();
  };

  const handleCreateAndReview = () => {
    const newAgent = createPersona();
    addSubagent(newAgent);
    addToast(`Created and dispatched ${newAgent.name}`, 'success');
    closeCreateAgentModal();

    const ws = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
    const repoPath = createAgentInitialContext?.repoPath || ws?.folders?.[0] || systemContext.cwd;
    const filePath = createAgentInitialContext?.filePath;

    if (repoPath) {
      runAgentReview({ repoPath, filePath, agent: newAgent });
    }
  };

  return (
    <div
      onClick={closeCreateAgentModal}
      className="fixed top-10 inset-x-0 bottom-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center">
              <Bot size={16} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Create AI Agent</h3>
              <p className="text-[10px] text-gray-400">Configure custom persona, live models, and review directives</p>
            </div>
          </div>
          <button onClick={closeCreateAgentModal} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div>
            <span className="block text-[11px] font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
              <Sparkles size={12} className="text-purple-400" /> Quick-start presets:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {AGENT_PRESET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    name === tpl.name ? 'bg-cyan-500/15 border-cyan-400/50 shadow-md' : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-[11px] font-bold text-white truncate">{tpl.name}</div>
                  <div className="text-[9px] text-gray-400 truncate mt-0.5">{tpl.role}</div>
                </button>
              ))}
            </div>
          </div>

          <AgentFormFields
            name={name} setName={setName}
            role={role} setRole={setRole}
            model={model} setModel={setModel}
            reasoningEffort={reasoningEffort} setReasoningEffort={setReasoningEffort}
            systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
          />
        </div>

        <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex items-center justify-end gap-2 shrink-0">
          <button onClick={closeCreateAgentModal} className="px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/10">
            Cancel
          </button>
          <button onClick={handleSaveOnly} className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white font-semibold flex items-center gap-1">
            <Check size={13} /> Save Agent
          </button>
          <button
            onClick={handleCreateAndReview}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
          >
            <Play size={12} /> Create & Run Review Now
          </button>
        </div>
      </div>
    </div>
  );
};
