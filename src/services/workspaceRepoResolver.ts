import { SavedWorkspace } from '../store/useAgentStore';

export interface WorkspaceRepoInfo {
  workspaceName: string;
  repoName: string;
  tag: string;
  formattedTag: string;
  rootPath: string;
  repoRoot?: string;
}

export const getWorkspaceDisplayName = (ws?: SavedWorkspace | null): string => {
  if (!ws) return 'Workspace';
  if (ws.name && ws.name.trim()) return ws.name.trim();
  return 'Workspace';
};

export const normalizePathSeparators = (p: string): string => {
  if (!p) return '';
  return p.replace(/\\/g, '/').replace(/\/+/g, '/');
};

export const resolveWorkspaceRepoInfo = (
  targetPath: string,
  workspaces: SavedWorkspace[] = [],
  activeWorkspaceId?: string | null,
  fallbackCwd?: string
): WorkspaceRepoInfo => {
  const cleanTarget = normalizePathSeparators(targetPath || '');
  const cleanCwd = normalizePathSeparators(fallbackCwd || '');

  // 1. Match against workspace folders
  for (const ws of workspaces) {
    if (!ws.folders) continue;
    for (const folder of ws.folders) {
      const cleanFolder = normalizePathSeparators(folder);
      if (cleanFolder && (cleanTarget === cleanFolder || cleanTarget.startsWith(cleanFolder + '/'))) {
        const repoName = cleanFolder.split('/').filter(Boolean).pop() || 'repo';
        const wsName = getWorkspaceDisplayName(ws);
        return {
          workspaceName: wsName,
          repoName,
          tag: `${wsName}:${repoName}`,
          formattedTag: `(${wsName}:${repoName})`,
          rootPath: cleanTarget,
          repoRoot: cleanFolder
        };
      }
    }
  }

  // 2. Fallback to active workspace or fallbackCwd
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeWsFolder = activeWs?.folders?.[0] ? normalizePathSeparators(activeWs.folders[0]) : '';
  const baseFolder = activeWsFolder || cleanCwd;
  const repoName = baseFolder ? baseFolder.split('/').filter(Boolean).pop() || 'repo' : 'repo';
  const wsName = activeWs ? getWorkspaceDisplayName(activeWs) : (workspaces[0] ? getWorkspaceDisplayName(workspaces[0]) : 'Workspace');

  let fullPath = cleanTarget;
  const isAbsolute = /^(?:[a-zA-Z]:[/\\]|\/)/.test(cleanTarget);
  if (!isAbsolute && baseFolder) {
    fullPath = normalizePathSeparators(`${baseFolder}/${cleanTarget.replace(/^\.?\//, '')}`);
  }

  return {
    workspaceName: wsName,
    repoName,
    tag: `${wsName}:${repoName}`,
    formattedTag: `(${wsName}:${repoName})`,
    rootPath: fullPath || baseFolder,
    repoRoot: baseFolder
  };
};
