import { MentionItem } from '../../../types/mention';
import { WorkspaceFileItem } from '../../../services/workspaceFileService';
import { resolveWorkspaceRepoInfo } from '../../../services/workspaceRepoResolver';
import { standardBuiltinSubagents } from '../../../data/defaultSubagents';
import { SubagentPersona } from '../../../types/subagents';

interface BuildMentionItemsParams {
  activeFilePath?: string;
  activeFileName?: string;
  workspaceFolders?: WorkspaceFileItem[];
  workspaceFiles?: WorkspaceFileItem[];
  subagents?: SubagentPersona[];
  workspaces?: any[];
  activeWorkspaceId?: string | null;
  cwd?: string;
}

export const buildMentionItems = ({
  activeFilePath,
  activeFileName,
  workspaceFolders = [],
  workspaceFiles = [],
  subagents,
  workspaces = [],
  activeWorkspaceId = null,
  cwd = ''
}: BuildMentionItemsParams): MentionItem[] => {
  const items: MentionItem[] = [
    { id: 'ctx-combo', name: 'combo', path: 'combo:ensemble', type: 'combo', description: 'Invoke the designated Agent Combo team pipeline for this repo', badge: 'COMBO' },
    { id: 'ctx-git', name: 'git', path: 'git:status', type: 'git', description: 'Workspace git status & modified diffs', badge: 'GIT' },
    { id: 'ctx-term', name: 'terminal', path: 'terminal:buffer', type: 'terminal', description: 'Recent terminal output & errors', badge: 'PTY' },
    { id: 'ctx-browser', name: 'browser', path: 'browser:dom', type: 'browser', description: 'Browser preview DOM hierarchy & console logs', badge: 'DOM' },
    { id: 'ctx-diag', name: 'diagnostics', path: 'system:diagnostics', type: 'diagnostics', description: 'System health & security finding audit', badge: 'DIAG' }
  ];

  // 1. Add Subagents for In-Chat Collaboration
  const activeSubagents = (subagents && subagents.length > 0 ? subagents : standardBuiltinSubagents).filter((s) => s.active);
  activeSubagents.forEach((sa) => {
    const cleanName = sa.id.replace(/^subagent-/, '');
    items.push({
      id: `sa-${sa.id}`,
      name: cleanName,
      path: sa.id,
      type: 'agent',
      badge: 'SUBAGENT',
      description: `${sa.name} (${sa.role})`
    });

    if (sa.id === 'subagent-backend-reviewer' && cleanName !== 'reviewer') {
      items.push({
        id: 'sa-alias-reviewer',
        name: 'reviewer',
        path: sa.id,
        type: 'agent',
        badge: 'SUBAGENT',
        description: `Quick Alias: ${sa.name} (${sa.role})`
      });
    }
  });

  // 2. Active File
  if (activeFilePath) {
    const info = resolveWorkspaceRepoInfo(activeFilePath, workspaces, activeWorkspaceId, cwd);
    items.unshift({
      id: `file-active-${activeFilePath}`,
      name: activeFileName || activeFilePath.split(/[/\\]/).pop() || 'active-file',
      path: activeFilePath,
      relativePath: activeFilePath,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'file',
      description: info.rootPath,
      badge: 'ACTIVE'
    });
  }

  // 3. Workspace Folders
  workspaceFolders.forEach((fd) => {
    const info = resolveWorkspaceRepoInfo(fd.path, workspaces, activeWorkspaceId, cwd);
    items.push({
      id: `folder-${fd.path}`,
      name: `${fd.name}/`,
      path: fd.path,
      relativePath: `${fd.relativePath}/`,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'folder',
      description: info.rootPath,
      badge: 'DIR'
    });
  });

  // 4. Workspace Files
  workspaceFiles.forEach((f) => {
    if (activeFilePath === f.path) return;
    const info = resolveWorkspaceRepoInfo(f.path, workspaces, activeWorkspaceId, cwd);
    items.push({
      id: `file-${f.path}`,
      name: f.name,
      path: f.path,
      relativePath: f.relativePath,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'file',
      description: info.rootPath
    });
  });

  return items;
};
