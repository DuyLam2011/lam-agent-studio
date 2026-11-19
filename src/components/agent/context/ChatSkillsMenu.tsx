import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Zap, Check, ChevronUp, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentSkill } from '../../../types/skills';
import clsx from 'clsx';

export const ChatSkillsMenu: React.FC = () => {
  const {
    agentSkills,
    activeSkillIdsForChat,
    toggleSkillForChat,
    setActiveSkillIdsForChat,
    setSkillSelectorModalOpen,
    systemContext
  } = useAgentStore();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const activeWorkspace = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const activeFolders = activeWorkspace?.folders || (systemContext.cwd ? [systemContext.cwd] : []);
  const norm = (p?: any) => (typeof p === 'string' ? p : p?.folderPath || p?.path || '').replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');

  const scopedSkills = useMemo(() => {
    const folders = activeFolders.map(norm).filter(Boolean);
    return agentSkills.filter((s) => s.scope === 'global' || (s.scope === 'repo' && s.targetId && folders.includes(norm(s.targetId))));
  }, [agentSkills, activeFolders]);

  const isSkillActive = (s: AgentSkill) =>
    activeSkillIdsForChat.includes(s.name) || activeSkillIdsForChat.includes(s.id) || (!!s.folderName && activeSkillIdsForChat.includes(s.folderName));

  const activeCount = scopedSkills.filter(isSkillActive).length;

  const handleApplyEssentials = () => {
    const essentials = scopedSkills
      .filter((s) => ['code_review', 'security_audit', 'senior code review', 'owasp']
        .some((k) => s.name.toLowerCase().includes(k) || (s.folderName && s.folderName.toLowerCase().includes(k))))
      .map((s) => s.name);
    setActiveSkillIdsForChat(essentials.length > 0 ? essentials : scopedSkills.slice(0, 2).map((s) => s.name));
  };

  const handleClear = () => {
    const scopedKeys = new Set(scopedSkills.flatMap((s) => [s.name, s.id, s.folderName].filter(Boolean) as string[]));
    setActiveSkillIdsForChat(activeSkillIdsForChat.filter((id) => !scopedKeys.has(id)));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all select-none",
          activeCount > 0
            ? "bg-primary/20 border-primary/40 text-primary font-semibold shadow-sm"
            : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
        )}
        title={`Active Skills (${activeCount}/${scopedSkills.length}). Click to toggle specialized skills inline.`}
      >
        <Zap size={11} className={activeCount > 0 ? "text-primary" : "text-gray-400"} />
        <span>Skills</span>
        {activeCount > 0 && (
          <span className="px-1.5 rounded-full text-[9px] bg-primary text-white font-mono leading-tight">
            {activeCount}
          </span>
        )}
        <ChevronUp size={10} className={clsx("transition-transform text-gray-400", !isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="surface-dropdown absolute bottom-full left-0 mb-2 w-72 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs rounded-2xl border border-white/10 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-primary" />
              <span className="font-bold text-xs text-gray-100">Skills ({activeCount}/{scopedSkills.length})</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={handleApplyEssentials}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-primary border border-white/10 transition-colors"
                title="Activate recommended essential skills (Code Review & Security Audit)"
              >
                Essentials
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors"
                title="Clear all active skills"
              >
                <RotateCcw size={10} />
              </button>
            </div>
          </div>

          {/* Quick Skills List */}
          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
            {scopedSkills.map((s) => {
              const active = isSkillActive(s);
              return (
                <button
                  key={s.id || s.name}
                  type="button"
                  onClick={() => toggleSkillForChat(s.name)}
                  className={clsx(
                    "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border group",
                    active
                      ? "bg-primary/20 border-primary/40 text-white font-medium"
                      : "surface-card border-transparent hover:border-white/10 text-gray-300"
                  )}
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-semibold truncate group-hover:text-white">{s.name}</div>
                    <div className="text-[10px] text-gray-400 truncate line-clamp-1">{s.description || 'Custom specialized skill'}</div>
                  </div>
                  {active && <Check size={12} className="text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-[10px] text-gray-400">
            <span>Inline Toggle Mode</span>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setSkillSelectorModalOpen(true); }}
              className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
            >
              <SlidersHorizontal size={10} />
              <span>Full Manager...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
