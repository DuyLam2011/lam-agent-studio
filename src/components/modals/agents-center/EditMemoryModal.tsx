import React, { useState } from 'react';
import { X, Save, Brain, Tag } from 'lucide-react';
import { ProjectMemoryItem, MemoryCategory, MemoryStatus } from '../../../types/memory';
import { useAgentStore } from '../../../store/useAgentStore';

interface EditMemoryModalProps {
  memory?: ProjectMemoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: MemoryCategory[] = ['decision', 'architecture', 'convention', 'gotcha', 'glossary'];
const STATUSES: MemoryStatus[] = ['accepted', 'proposed', 'deprecated', 'superseded'];

export const EditMemoryModal: React.FC<EditMemoryModalProps> = ({ memory, isOpen, onClose }) => {
  const { addMemory, updateMemory, addToast, currentRuleScope } = useAgentStore();
  const [title, setTitle] = useState(memory?.title || '');
  const [category, setCategory] = useState<MemoryCategory>(memory?.category || 'decision');
  const [status, setStatus] = useState<MemoryStatus>(memory?.status || 'accepted');
  const [tagsStr, setTagsStr] = useState(memory?.tags?.join(', ') || '');
  const [content, setContent] = useState(memory?.content || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      addToast('Title and content are required', 'info');
      return;
    }
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    if (memory?.id) {
      updateMemory(memory.id, { title, category, status, tags, content, updatedAt: Date.now() });
      addToast(`Updated memory: ${title}`, 'success');
    } else {
      const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : currentRuleScope.type === 'repo' ? 'repo' : 'global';
      const newItem: ProjectMemoryItem = {
        id: `memory-${Date.now()}`,
        title, category, status, tags, content,
        scope: targetScope,
        targetId: targetScope === 'workspace' ? currentRuleScope.workspaceId : (targetScope === 'repo' ? currentRuleScope.repoPath : undefined),
        pinned: true,
        updatedAt: Date.now()
      };
      addMemory(newItem);
      addToast(`Saved new memory in .agents/memory/${category}s/`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="surface-modal w-[600px] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 surface-header flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-gray-200">{memory ? 'Edit Memory / ADR' : 'New Architectural Memory'}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><X size={15} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase">Title / Architectural Decision</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Use Zustand for Global State" className="w-full mt-1 surface-input px-3 py-1.5 rounded-xl border border-subtle text-xs text-gray-200 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-gray-400 uppercase">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as MemoryCategory)} className="w-full mt-1 surface-input px-3 py-1.5 rounded-xl border border-subtle text-xs text-gray-200 focus:outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400 uppercase">ADR Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as MemoryStatus)} className="w-full mt-1 surface-input px-3 py-1.5 rounded-xl border border-subtle text-xs text-gray-200 focus:outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1"><Tag size={10} /> Tags (comma-separated)</label>
            <input type="text" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="state, zustand, architecture" className="w-full mt-1 surface-input px-3 py-1.5 rounded-xl border border-subtle text-xs text-gray-200 focus:outline-none" />
          </div>

          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase">Markdown Content & Directive</label>
            <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Rationale, context, trade-offs, and invariants..." className="w-full mt-1 surface-input p-3 rounded-xl border border-subtle text-xs text-gray-200 focus:outline-none custom-scrollbar font-mono resize-none leading-relaxed" />
          </div>
        </div>

        <div className="p-3 surface-header border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-mono">Persists as Markdown in .agents/memory/{category}s/</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 rounded-xl hover:bg-white/5 text-xs text-gray-400">Cancel</button>
            <button onClick={handleSave} className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
              <Save size={13} /><span>Save Memory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
