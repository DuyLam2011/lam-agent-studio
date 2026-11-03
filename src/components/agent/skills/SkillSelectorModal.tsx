import React, { useState, useMemo } from 'react';
import { Zap, FolderGit2 } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { AgentSkill } from '../../../types/skills';
import { SkillAccordionGroup } from './SkillAccordionGroup';
import { SkillSelectorToolbar } from './SkillSelectorToolbar';
import { SkillSelectorHeader } from './SkillSelectorHeader';
import { SkillSelectorFooter } from './SkillSelectorFooter';
import { loadSkillsAccordionState, saveSkillsAccordionState } from '../../../services/persistence/skillsPersistenceService';

export const SkillSelectorModal: React.FC = () => {
  const {
    isSkillSelectorModalOpen, setSkillSelectorModalOpen, systemContext, agentSkills,
    activeSkillIdsForChat, toggleSkillForChat, setActiveSkillIdsForChat,
  } = useAgentStore();
  const [search, setSearch] = useState('');
  const [accordionState, setAccordionState] = useState<Record<string, boolean>>(() => loadSkillsAccordionState());

  const activeWorkspace = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
  const workspaceName = activeWorkspace?.name || 'Untitled Workspace';
  const activeFolders = activeWorkspace?.folders || (systemContext.cwd ? [systemContext.cwd] : []);
  const normalize = (p?: any) => {
    const str = typeof p === 'string' ? p : (p?.folderPath || p?.path || '');
    return str ? str.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '') : '';
  };

  const scopedSkills = useMemo(() => {
    const normFolders = activeFolders.map(normalize).filter(Boolean);
    return agentSkills.filter((s) => s.scope === 'global' || (s.scope === 'repo' && s.targetId && normFolders.includes(normalize(s.targetId))));
  }, [agentSkills, activeFolders]);

  const isSkillActive = (s: AgentSkill) =>
    activeSkillIdsForChat.includes(s.name) ||
    activeSkillIdsForChat.includes(s.id) ||
    (!!s.folderName && activeSkillIdsForChat.includes(s.folderName));

  const activeCount = useMemo(() => scopedSkills.filter(isSkillActive).length, [scopedSkills, activeSkillIdsForChat]);

  if (!isSkillSelectorModalOpen) return null;

  const searchLower = search.trim().toLowerCase();
  const filterSearch = (skills: AgentSkill[]) =>
    !searchLower ? skills : skills.filter((s) => s.name.toLowerCase().includes(searchLower) || s.description.toLowerCase().includes(searchLower));

  const globalSkills = filterSearch(scopedSkills.filter((s) => s.scope === 'global'));
  const isGroupExpanded = (gid: string) => (searchLower ? true : (accordionState[gid] ?? true));

  const handleToggleExpand = (gid: string) => {
    const nextState = { ...accordionState, [gid]: !isGroupExpanded(gid) };
    setAccordionState(nextState);
    saveSkillsAccordionState(nextState);
  };

  const handleApplyEssentials = () => {
    const essentials = scopedSkills
      .filter((s) => ['code_review', 'security_audit', 'senior code review', 'owasp security audit']
        .some((k) => s.name.toLowerCase().includes(k) || (s.folderName && s.folderName.toLowerCase().includes(k))))
      .map((s) => s.name);
    setActiveSkillIdsForChat(essentials.length > 0 ? essentials : scopedSkills.slice(0, 2).map((s) => s.name));
  };

  const handleToggleGroupAll = (skills: AgentSkill[], activate: boolean) => {
    const names = skills.map((s) => s.name);
    const next = activate ? Array.from(new Set([...activeSkillIdsForChat, ...names])) : activeSkillIdsForChat.filter((name) => !names.includes(name));
    setActiveSkillIdsForChat(next);
  };

  const handleClear = () => {
    const scopedKeys = new Set(scopedSkills.flatMap((s) => [s.name, s.id, s.folderName].filter(Boolean) as string[]));
    setActiveSkillIdsForChat(activeSkillIdsForChat.filter((id) => !scopedKeys.has(id)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl surface-modal flex flex-col overflow-hidden max-h-[85vh] shadow-2xl">
        <SkillSelectorHeader workspaceName={workspaceName} onClose={() => setSkillSelectorModalOpen(false)} />

        <SkillSelectorToolbar
          search={search}
          onSearchChange={setSearch}
          activeCount={activeCount}
          totalCount={scopedSkills.length}
          onApplyEssentials={handleApplyEssentials}
          onSelectAll={() => setActiveSkillIdsForChat(Array.from(new Set([...activeSkillIdsForChat, ...scopedSkills.map((s) => s.name)])))}
          onClear={handleClear}
        />

        <div className="p-3 overflow-y-auto custom-scrollbar space-y-2.5 flex-1">
          {globalSkills.length > 0 && (
            <SkillAccordionGroup
              groupId="global"
              title="Built-in & System Skills"
              tagBadge="(Global)"
              icon={<Zap size={13} className="text-primary" />}
              skills={globalSkills}
              activeSkillIds={activeSkillIdsForChat}
              isExpanded={isGroupExpanded('global')}
              onToggleExpand={handleToggleExpand}
              onToggleSkill={toggleSkillForChat}
              onToggleGroupAll={handleToggleGroupAll}
            />
          )}

          {activeFolders.map((folder) => {
            const repoName = folder.split(/[/\\]/).filter(Boolean).pop() || folder;
            const normFolder = normalize(folder);
            const repoSkills = filterSearch(scopedSkills.filter((s) => s.scope === 'repo' && normalize(s.targetId) === normFolder));
            const groupId = `repo:${normFolder}`;
            return (
              <SkillAccordionGroup
                key={groupId}
                groupId={groupId}
                title={repoName}
                tagBadge={`(${workspaceName}:${repoName})`}
                icon={<FolderGit2 size={13} className="text-cyan-400" />}
                skills={repoSkills}
                activeSkillIds={activeSkillIdsForChat}
                isExpanded={isGroupExpanded(groupId)}
                onToggleExpand={handleToggleExpand}
                onToggleSkill={toggleSkillForChat}
                onToggleGroupAll={handleToggleGroupAll}
              />
            );
          })}
        </div>

        <SkillSelectorFooter
          activeCount={activeCount}
          totalCount={scopedSkills.length}
          onClose={() => setSkillSelectorModalOpen(false)}
        />
      </div>
    </div>
  );
};