import React, { useState, useEffect } from 'react';
import { X, Save, Wrench, Check } from 'lucide-react';
import { AgentSkill } from '../../../types/skills';
import { useAgentStore } from '../../../store/useAgentStore';

interface SkillEditorModalProps {
  skill: AgentSkill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SkillEditorModal: React.FC<SkillEditorModalProps> = ({ skill, isOpen, onClose }) => {
  const { updateSkill, addSkill, addToast, currentRuleScope, systemContext } = useAgentStore();
  const [name, setName] = useState(skill?.name || '');
  const [folderName, setFolderName] = useState(skill?.folderName || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [content, setContent] = useState(skill?.content || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setFolderName(skill.folderName || skill.name.toLowerCase().replace(/\s+/g, '_'));
      setDescription(skill.description);
      setContent(skill.content);
    } else {
      setName('');
      setFolderName('');
      setDescription('');
      setContent('---\nname: my_skill\ndescription: Skill description here\n---\n\n# Workflow Guidelines\n1. Define tool steps.\n2. Verification criteria.\n');
    }
  }, [skill, isOpen]);

  if (!isOpen) return null;
  const currentWorkspace = systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId) || systemContext.workspaces[0];
  const targetRepoPath = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : currentWorkspace?.folders?.[0];

  const handleSave = async () => {
    if (!name.trim()) return addToast('Skill name is required', 'error');
    setIsSaving(true);
    try {
      const cleanFolder = (folderName.trim() || name.trim()).toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
      if (skill) {
        updateSkill(skill.id, { name, folderName: cleanFolder, description, content });
        if (skill.filePath) {
          // @ts-ignore
          await window.lamApi?.fs?.saveFile?.(skill.filePath, content);
          addToast(`Synced changes directly to ${skill.filePath.split(/[/\\]/).pop()}`, 'success');
        } else {
          addToast('Skill updated successfully', 'success');
        }
      } else {
        let savedPath: string | undefined;
        if (targetRepoPath) {
          // @ts-ignore
          const saveRes = await window.lamApi?.skills?.saveSkill?.(targetRepoPath, cleanFolder, content);
          if (saveRes?.success) savedPath = saveRes.filePath;
        }
        const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : (currentRuleScope.type === 'repo' ? 'repo' : 'global');
        addSkill({
          id: `custom-skill-${Date.now()}`,
          name,
          folderName: cleanFolder,
          description,
          content,
          scope: targetScope,
          targetId: targetScope === 'workspace' ? currentRuleScope.workspaceId : (targetScope === 'repo' ? currentRuleScope.repoPath : undefined),
          source: savedPath ? 'file' : 'custom',
          filePath: savedPath,
          active: true,
          updatedAt: Date.now()
        });
        addToast(savedPath ? `Saved skill to ${cleanFolder}/SKILL.md` : 'Created custom skill', 'success');
      }
      onClose();
    } catch {
      addToast('Failed to save skill', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-[680px] max-h-[85vh] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            <Wrench size={15} className="text-primary" />
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{skill ? 'Edit Skill' : 'Create Custom Skill'}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={15} /></button>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Skill Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Next.js Route Auditor" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Folder Name</label>
              <input type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. next_route_auditor" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-primary/50 font-mono" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When and how the AI agent should invoke this skill..." className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-200 outline-none focus:border-primary/50" />
          </div>

          <div className="flex-1 flex flex-col min-h-[220px]">
            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">Skill Directives (SKILL.md)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed outline-none focus:border-primary/50 resize-none custom-scrollbar" />
          </div>
        </div>

        <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors">
            {isSaving ? <Check size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{skill?.filePath ? 'Save & Sync to File' : 'Save Skill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
