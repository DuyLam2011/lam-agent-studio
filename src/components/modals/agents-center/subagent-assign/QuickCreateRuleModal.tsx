import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Check } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { AgentClassType } from '../../../../types/agent-class';
import { AgentRule } from '../../../../types/rules';
import { getRuleTemplateForClass } from '../../../../services/subagents/subagentQuickTemplates';

interface QuickCreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  subagentName: string;
  agentClass: AgentClassType;
  onRuleCreated: (ruleId: string) => void;
}

export const QuickCreateRuleModal: React.FC<QuickCreateRuleModalProps> = ({
  isOpen,
  onClose,
  subagentName,
  agentClass,
  onRuleCreated,
}) => {
  const { addRule, addToast, activeRepoPath, systemContext } = useAgentStore();
  const template = getRuleTemplateForClass(agentClass, subagentName);

  const [name, setName] = useState(template.name);
  const [ruleId, setRuleId] = useState(template.folderOrId);
  const [description, setDescription] = useState(template.description);
  const [content, setContent] = useState(template.content);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || !ruleId.trim()) {
      addToast('Name and Rule ID are required', 'info');
      return;
    }
    const cleanId = ruleId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newRule: AgentRule = {
      id: cleanId,
      name: name.trim(),
      description: description.trim(),
      content: content.trim(),
      scope: activeRepoPath ? 'repo' : 'global',
      targetId: activeRepoPath || undefined,
      source: 'custom',
      active: true,
      updatedAt: Date.now(),
    };
    addRule(newRule);
    const targetPath = activeRepoPath || systemContext.cwd || '';
    if (targetPath && window.lamApi?.rules?.saveRule) {
      try {
        await window.lamApi.rules.saveRule(targetPath, `${cleanId}.md`, content);
      } catch (err) {
        console.warn('Failed to persist rule file:', err);
      }
    }
    onRuleCreated(cleanId);
    addToast(`Created & assigned rule "${name}" for ${subagentName}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg surface-modal rounded-3xl overflow-hidden flex flex-col border border-subtle shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle surface-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BookOpen size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-app-text">Create Rule for {subagentName}</h3>
              <p className="text-[10px] text-app-sub">Guardrail policy tailored for {agentClass.toUpperCase()} class</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-app-sub hover:text-app-text hover:bg-white/10">
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl px-3 py-1.5 text-app-text placeholder:text-app-muted focus:outline-none focus:border-purple-400 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Rule Identifier (kebab-case)</label>
            <input
              type="text"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl px-3 py-1.5 text-app-text font-mono placeholder:text-app-muted focus:outline-none focus:border-purple-400 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl px-3 py-1.5 text-app-text placeholder:text-app-muted focus:outline-none focus:border-purple-400 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Rule Specification (.rules content)</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl p-2.5 text-app-text font-mono text-[11px] placeholder:text-app-muted focus:outline-none focus:border-purple-400 resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle surface-header flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-app-muted">
            <Sparkles size={11} className="text-purple-400" /> Auto-assigned on creation
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-xs text-app-sub hover:text-app-text">Cancel</button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check size={13} strokeWidth={3} /> Create & Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
