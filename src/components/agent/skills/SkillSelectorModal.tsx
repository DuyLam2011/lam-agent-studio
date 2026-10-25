import React, { useState } from 'react';
import { X, Zap, Search } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { SkillSelectorItem } from './SkillSelectorItem';

export const SkillSelectorModal: React.FC = () => {
  const {
    isSkillSelectorModalOpen,
    setSkillSelectorModalOpen,
    systemContext,
    getActiveSkillsForContext,
    activeSkillIdsForChat,
    toggleSkillForChat,
    setActiveSkillIdsForChat
  } = useAgentStore();
  const [search, setSearch] = useState('');

  if (!isSkillSelectorModalOpen) return null;

  const activeWorkspace = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
  const workspacePath = activeWorkspace?.folders?.[0] || systemContext.cwd;
  const wsId = systemContext.activeWorkspaceId || undefined;

  const allSkills = getActiveSkillsForContext(wsId, workspacePath);
  const filtered = allSkills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyEssentials = () => {
    const essentials = allSkills
      .filter(s => ['code_review', 'security_audit', 'enhance_ui', 'optimize_codebase'].includes(s.name.toLowerCase()))
      .map(s => s.name);
    setActiveSkillIdsForChat(essentials.length > 0 ? essentials : allSkills.slice(0, 3).map(s => s.name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">Dynamic Skills Applicator</h3>
              <p className="text-[10px] text-gray-400">Select which skills are active for the AI Agent coding session</p>
            </div>
          </div>
          <button
            onClick={() => setSkillSelectorModalOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search & Presets Toolbar */}
        <div className="p-3 border-b border-white/5 space-y-2 bg-black/20">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills by name or keyword..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 font-mono">{activeSkillIdsForChat.length} of {allSkills.length} active</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleApplyEssentials}
                className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors"
              >
                Coding Essentials
              </button>
              <button
                onClick={() => setActiveSkillIdsForChat(allSkills.map(s => s.name))}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setActiveSkillIdsForChat([])}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Skills List */}
        <div className="p-3 overflow-y-auto custom-scrollbar space-y-1.5 flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">No matching skills found.</div>
          ) : (
            filtered.map((skill) => (
              <SkillSelectorItem
                key={skill.id || skill.name}
                skill={skill}
                isActive={activeSkillIdsForChat.includes(skill.name)}
                onToggle={toggleSkillForChat}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-black/40 flex justify-end">
          <button
            onClick={() => setSkillSelectorModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
