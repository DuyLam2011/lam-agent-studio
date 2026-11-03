import { SavedWorkspace } from '../../store/useAgentStore';
import { getWorkspaceDisplayName, normalizePathSeparators } from './workspaceRepoResolver';

export interface DiscoveredRepo {
  name: string;
  root: string;
  tag: string;
  workspaceId?: string;
  workspaceName: string;
}

export interface ActiveRepoScopeParams {
  workspaces?: SavedWorkspace[];
  activeWorkspaceId?: string | null;
  contextAttachments?: Array<{ path?: string; workspaceRepoTag?: string; rootPath?: string }>;
  activeFilePath?: string | null;
  promptText?: string;
  activeRepoPath?: string | null;
  fallbackCwd?: string;
}

export interface ActiveRepoScopeResult {
  workspaceId?: string;
  workspaceName: string;
  repoName: string;
  repoRoot: string;
  tag: string;
  formattedTag: string;
  isMultiRepo: boolean;
  availableRepos: DiscoveredRepo[];
  resolutionSource: 'prompt_mention' | 'attachment' | 'active_file' | 'explicit_selection' | 'workspace_default';
}

export const discoverWorkspaceRepos = (
  workspaces: SavedWorkspace[] = [],
  activeWorkspaceId?: string | null,
  fallbackCwd?: string
): { activeWs?: SavedWorkspace; repos: DiscoveredRepo[] } => {
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const repos: DiscoveredRepo[] = [];
  const cleanCwd = normalizePathSeparators(fallbackCwd || '');

  if (activeWs?.folders && activeWs.folders.length > 0) {
    const wsName = getWorkspaceDisplayName(activeWs);
    for (const folder of activeWs.folders) {
      const cleanRoot = normalizePathSeparators(folder);
      const name = cleanRoot.split('/').filter(Boolean).pop() || 'repo';
      repos.push({ name, root: cleanRoot, tag: `${wsName}:${name}`, workspaceId: activeWs.id, workspaceName: wsName });
    }
  } else if (cleanCwd) {
    const name = cleanCwd.split('/').filter(Boolean).pop() || 'repo';
    repos.push({ name, root: cleanCwd, tag: `Workspace:${name}`, workspaceName: 'Workspace' });
  }

  return { activeWs, repos };
};

export const resolveActiveRepoScope = (params: ActiveRepoScopeParams): ActiveRepoScopeResult => {
  const { activeWs, repos } = discoverWorkspaceRepos(params.workspaces, params.activeWorkspaceId, params.fallbackCwd);
  const wsName = getWorkspaceDisplayName(activeWs);
  const isMultiRepo = repos.length > 1;

  const buildResult = (r: DiscoveredRepo, source: ActiveRepoScopeResult['resolutionSource']): ActiveRepoScopeResult => ({
    workspaceId: activeWs?.id,
    workspaceName: wsName,
    repoName: r.name,
    repoRoot: r.root,
    tag: r.tag,
    formattedTag: `(${r.tag})`,
    isMultiRepo,
    availableRepos: repos,
    resolutionSource: source
  });

  // 1. Explicit mention in user prompt
  if (params.promptText && repos.length > 0) {
    const lower = params.promptText.toLowerCase();
    const matched = repos.find((r) => lower.includes(r.name.toLowerCase()) || lower.includes(r.tag.toLowerCase()));
    if (matched) return buildResult(matched, 'prompt_mention');
  }

  // 2. High priority: Attached context payload tags and paths
  if (params.contextAttachments && params.contextAttachments.length > 0) {
    for (let i = params.contextAttachments.length - 1; i >= 0; i--) {
      const att = params.contextAttachments[i];
      if (att.workspaceRepoTag) {
        const byTag = repos.find((r) => r.tag.toLowerCase() === att.workspaceRepoTag?.toLowerCase());
        if (byTag) return buildResult(byTag, 'attachment');
      }
      if (att.path) {
        const cleanPath = normalizePathSeparators(att.path);
        const byPath = repos.find((r) => cleanPath === r.root || cleanPath.startsWith(r.root + '/'));
        if (byPath) return buildResult(byPath, 'attachment');
      }
    }
  }

  // 3. Active open file in editor
  if (params.activeFilePath) {
    const cleanActive = normalizePathSeparators(params.activeFilePath);
    const byFile = repos.find((r) => cleanActive === r.root || cleanActive.startsWith(r.root + '/'));
    if (byFile) return buildResult(byFile, 'active_file');
  }

  // 4. Explicit user selection in state
  if (params.activeRepoPath) {
    const cleanSelected = normalizePathSeparators(params.activeRepoPath);
    const bySelect = repos.find((r) => r.root === cleanSelected);
    if (bySelect) return buildResult(bySelect, 'explicit_selection');
  }

  // 5. Default fallback to first repository
  const defaultRepo = repos[0] || {
    name: 'workspace',
    root: normalizePathSeparators(params.fallbackCwd || ''),
    tag: `${wsName}:workspace`,
    workspaceName: wsName
  };
  return buildResult(defaultRepo, 'workspace_default');
};
