import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Check } from 'lucide-react';
import { AgentRule } from '../../../types/rules';
import { useAgentStore } from '../../../store/useAgentStore';

interface RuleEditorModalProps {
  rule: AgentRule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({ rule, isOpen, onClose }) => {
  const { updateRule, addRule, addToast, currentRuleScope } = useAgentStore();
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [content, setContent] = useState(rule?.content || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description);
      setContent(rule.content);
    } else {
      setName('');
      setDescription('');
      setContent('# NEW AI BEHAVIORAL RULE\n- Define guidelines, coding standards, or architecture boundaries here.\n');
    }
  }, [rule, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return addToast('Rule name is required', 'error');
    setIsSaving(true);
    try {
      if (rule) {
        updateRule(rule.id, { name, description, content });
        if (rule.filePath) {
          // @ts-ignore
          await window.lamApi?.fs?.saveFile?.(rule.filePath, content);
          addToast(`Synced changes directly to ${rule.filePath.split(/[/\\]/).pop()}`, 'success');
        } else {
          addToast('Rule updated successfully', 'success');
        }
      } else {
        const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
        const newRule: AgentRule = {
          id: `custom-rule-${Date.now()}`,
          name,
          description,
          content,
          scope: targetScope,
          targetId: targetScope === 'workspace' ? currentRuleScope.workspaceId : (targetScope === 'repo' ? currentRuleScope.repoPath : undefined),
          source: 'custom',
          active: true,
          updatedAt: Date.now()
        };
        if (targetScope === 'repo' && currentRuleScope.repoPath) {
          // @ts-ignore
          const res = await window.lamApi?.rules?.saveRule?.(currentRuleScope.repoPath, 'GEMINI.md', content);
          if (res?.success) newRule.filePath = res.filePath;
        }
        addRule(newRule);
        addToast(newRule.filePath ? 'Saved repository rule to GEMINI.md' : 'New custom rule created', 'success');
      }
      onClose();
    } catch {
      addToast('Failed to save rule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[680px] max-h-[85vh] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-primary" />
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
              {rule ? 'Edit Rule' : 'Create Custom Rule'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Rule Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Strict Modularity Constraints"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Scope</label>
              <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-gray-400 font-mono text-xs capitalize truncate">
                {rule?.scope || currentRuleScope.type}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of when and how this rule applies..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[220px]">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Rule Directives (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# RULE SPECIFICATIONS&#10;- Directive 1&#10;- Directive 2"
              className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed outline-none focus:border-primary/50 resize-none custom-scrollbar"
            />
          </div>
        </div>

        <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors"
          >
            {isSaving ? <Check size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{rule?.filePath ? 'Save & Sync to File' : 'Save Rule'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
