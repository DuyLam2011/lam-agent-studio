import { WorkspaceFolderCommandSetting } from '../../types/command-settings';
import { normalizePathSeparators } from '../workspace/workspaceRepoResolver';

const STORAGE_KEY = 'lam_command_folder_settings';

let memoryCache: Record<string, WorkspaceFolderCommandSetting> = {};

export const loadFolderCommandSettings = (): Record<string, WorkspaceFolderCommandSetting> => {
  if (typeof window === 'undefined') return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : memoryCache;
  } catch {
    return memoryCache;
  }
};

export const saveFolderCommandSettings = (settings: Record<string, WorkspaceFolderCommandSetting>): void => {
  memoryCache = settings;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Graceful fallback
  }
};

export const makeFolderSettingKey = (workspaceId: string, repoPath: string): string => {
  const cleanRepo = normalizePathSeparators(repoPath || '');
  return `${workspaceId || 'default'}::${cleanRepo || 'root'}`;
};

export const getFolderCommandSetting = (workspaceId: string, repoPath: string): WorkspaceFolderCommandSetting => {
  const all = loadFolderCommandSettings();
  const key = makeFolderSettingKey(workspaceId, repoPath);
  return all[key] || {
    workspaceId: workspaceId || 'default',
    repoPath: repoPath || '',
    defaultSubfolder: '.',
    lastUsedFolder: repoPath || '.',
    folderAliases: {
      client: 'apps/web',
      backend: 'services/api',
      server: 'src/server',
      scripts: 'scripts'
    },
    updatedAt: Date.now()
  };
};

export const setWorkspaceCommandFolder = (
  workspaceId: string,
  repoPath: string,
  subfolder: string
): WorkspaceFolderCommandSetting => {
  const all = loadFolderCommandSettings();
  const key = makeFolderSettingKey(workspaceId, repoPath);
  const current = getFolderCommandSetting(workspaceId, repoPath);
  const updated: WorkspaceFolderCommandSetting = {
    ...current,
    defaultSubfolder: subfolder,
    lastUsedFolder: subfolder,
    updatedAt: Date.now()
  };
  all[key] = updated;
  saveFolderCommandSettings(all);
  return updated;
};

export const resolveEffectiveCommandDir = (
  workspaceId?: string,
  repoPath?: string,
  requestedSubfolder?: string
): string => {
  const base = repoPath || process.cwd?.() || '.';
  if (!requestedSubfolder || requestedSubfolder === '.' || requestedSubfolder === '/') {
    const setting = getFolderCommandSetting(workspaceId || '', repoPath || '');
    if (setting.defaultSubfolder && setting.defaultSubfolder !== '.') {
      return normalizePathSeparators(`${base}/${setting.defaultSubfolder}`);
    }
    return normalizePathSeparators(base);
  }

  const cleanReq = normalizePathSeparators(requestedSubfolder);
  if (cleanReq.startsWith('/') || /^[a-zA-Z]:/.test(cleanReq)) {
    return cleanReq;
  }
  return normalizePathSeparators(`${base}/${cleanReq}`);
};
