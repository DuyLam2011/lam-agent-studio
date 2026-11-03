import React, { useState } from 'react';
import { X, Wrench, Sparkles, Check } from 'lucide-react';
import { useAgentStore } from '../../../../store/useAgentStore';
import { AgentClassType } from '../../../../types/agent-class';
import { AgentSkill } from '../../../../types/skills';
import { getSkillTemplateForClass } from '../../../../services/subagents/subagentQuickTemplates';

interface QuickCreateSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  subagentName: string;
  agentClass: AgentClassType;
  onSkillCreated: (folderName: string) => void;
}

export const QuickCreateSkillModal: React.FC<QuickCreateSkillModalProps> = ({
  isOpen,
  onClose,
  subagentName,
  agentClass,
  onSkillCreated,
}) => {
  const { addSkill, addToast, activeRepoPath, systemContext } = useAgentStore();
  const template = getSkillTemplateForClass(agentClass, subagentName);

  const [name, setName] = useState(template.name);
  const [folderName, setFolderName] = useState(template.folderOrId);
  const [description, setDescription] = useState(template.description);
  const [content, setContent] = useState(template.content);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || !folderName.trim()) {
      addToast('Name and Folder Name are required', 'info');
      return;
    }
    const cleanFolder = folderName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newSkill: AgentSkill = {
      id: `skill-${Date.now()}`,
      name: name.trim(),
      folderName: cleanFolder,
      description: description.trim(),
      content: content.trim(),
      scope: activeRepoPath ? 'repo' : 'global',
      targetId: activeRepoPath || undefined,
      source: 'custom',
      active: true,
      category: agentClass === 'architecture' ? 'architecture' : agentClass === 'planner' ? 'workflow' : 'code-quality',
      updatedAt: Date.now(),
    };
    addSkill(newSkill);
    const targetPath = activeRepoPath || systemContext.cwd || '';
    if (targetPath && window.lamApi?.skills?.saveSkill) {
      try {
        await window.lamApi.skills.saveSkill(targetPath, cleanFolder, content);
      } catch (err) {
        console.warn('Failed to persist skill file:', err);
      }
    }
    onSkillCreated(cleanFolder);
    addToast(`Created & assigned skill "${name}" for ${subagentName}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg surface-modal rounded-3xl overflow-hidden flex flex-col border border-subtle shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle surface-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Wrench size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-app-text">Create Skill for {subagentName}</h3>
              <p className="text-[10px] text-app-sub">Pre-configured template for {agentClass.toUpperCase()} class</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-app-sub hover:text-app-text hover:bg-white/10">
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Skill Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl px-3 py-1.5 text-app-text placeholder:text-app-muted focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Folder Identifier (kebab-case)</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl px-3 py-1.5 text-app-text font-mono placeholder:text-app-muted focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl px-3 py-1.5 text-app-text placeholder:text-app-muted focus:outline-none focus:border-cyan-400 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-app-sub mb-1 block">SKILL.md Instruction Content</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full surface-input border border-subtle rounded-xl p-2.5 text-app-text font-mono text-[11px] placeholder:text-app-muted focus:outline-none focus:border-cyan-400 resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-subtle surface-header flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-app-muted">
            <Sparkles size={11} className="text-cyan-400" /> Auto-assigned on creation
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-xs text-app-sub hover:text-app-text">Cancel</button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check size={13} strokeWidth={3} /> Create & Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
