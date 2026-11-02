import { useAgentStore, ContextAttachment } from '../store/useAgentStore';
import { resolveWorkspaceRepoInfo } from './workspaceRepoResolver';

export interface WorkspaceFileItem {
  path: string;
  relativePath: string;
  name: string;
}

export const listWorkspaceFilesAndFolders = async (
  rootPath: string
): Promise<{ files: WorkspaceFileItem[]; folders: WorkspaceFileItem[] }> => {
  if (!rootPath) return { files: [], folders: [] };

  try {
    // @ts-ignore
    const res = await window.lamApi?.fs?.listWorkspaceFiles?.(rootPath, 1000);
    if (res?.success) {
      return {
        files: Array.isArray(res.files) ? res.files : [],
        folders: Array.isArray(res.folders) ? res.folders : []
      };
    }
  } catch (err) {
    console.warn('listWorkspaceFilesAndFolders IPC failed:', err);
  }

  // Fallback for tests / mock
  try {
    // @ts-ignore
    const dirRes = await window.lamApi?.fs?.readDirectory?.(rootPath);
    if (dirRes?.success && Array.isArray(dirRes.data)) {
      const files: WorkspaceFileItem[] = [];
      const folders: WorkspaceFileItem[] = [];
      dirRes.data.forEach((item: any) => {
        const itemObj = { path: `${rootPath}/${item.name}`, relativePath: item.name, name: item.name };
        if (item.isDirectory) folders.push(itemObj);
        else files.push(itemObj);
      });
      return { files, folders };
    }
  } catch {}

  return { files: [], folders: [] };
};

export const listWorkspaceFiles = async (rootPath: string): Promise<WorkspaceFileItem[]> => {
  const res = await listWorkspaceFilesAndFolders(rootPath);
  return res.files;
};

export const packFolderContext = async (
  folderPath: string,
  customName?: string
): Promise<ContextAttachment | null> => {
  if (!folderPath) return null;
  const store = useAgentStore.getState();
  const folderName = customName || folderPath.split(/[/\\]/).filter(Boolean).pop() || 'folder';
  const info = resolveWorkspaceRepoInfo(
    folderPath, store.systemContext.workspaces, store.systemContext.activeWorkspaceId, store.systemContext.cwd
  );

  try {
    // @ts-ignore
    const res = await window.lamApi?.fs?.packFolderContext?.(folderPath, 35);
    if (res?.success && res.snippet) {
      const attachment: ContextAttachment = {
        id: `ctx-folder-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: `${folderName}/`,
        path: folderPath,
        relativePath: res.relativePath || folderName,
        rootPath: info.rootPath,
        workspaceRepoTag: info.tag,
        type: 'folder',
        tokenEstimate: res.tokenEstimate || 300,
        pinned: true,
        snippet: res.snippet
      };
      store.addContextAttachment(attachment);
      store.addToast(`Attached folder @${folderName}/ (${info.tag}) (${res.totalFiles || 0} files)`, 'success');
      return attachment;
    }
  } catch (err) {
    console.error('packFolderContext failed via IPC:', err);
  }

  // Fallback representation
  const fallbackSnippet = `### 📁 FOLDER CONTEXT: ${folderName}/ (${info.tag})\nRoot Path: ${info.rootPath}\n(Monitored by agent runtime)`;
  const fallbackAtt: ContextAttachment = {
    id: `ctx-folder-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: `${folderName}/`,
    path: folderPath,
    relativePath: folderName,
    rootPath: info.rootPath,
    workspaceRepoTag: info.tag,
    type: 'folder',
    tokenEstimate: 200,
    pinned: true,
    snippet: fallbackSnippet
  };
  store.addContextAttachment(fallbackAtt);
  store.addToast(`Attached folder @${folderName}/ (${info.tag}) to Chat Context`, 'success');
  return fallbackAtt;
};

export const openFileInEditor = async (
  filePath: string,
  name?: string,
  line?: number
): Promise<void> => {
  if (!filePath || filePath.startsWith('git:') || filePath.startsWith('system:')) return;
  const store = useAgentStore.getState();
  const fileName = name || filePath.split(/[/\\]/).filter(Boolean).pop() || 'item';

  // If clicking on a folder context, expand folder in file tree
  if (name?.endsWith('/') || !filePath.includes('.')) {
    store.toggleFolder(filePath, true);
    store.setPanelVisible?.('explorer', true);
    store.addToast(`Expanded folder in Explorer: ${fileName}`, 'info');
    return;
  }

  let content = '';
  try {
    // @ts-ignore
    const res = await window.lamApi?.fs?.readFile?.(filePath);
    if (res?.success && typeof res.data === 'string') {
      content = res.data;
    }
  } catch (err) {
    console.error('Failed reading file to open in editor:', err);
  }

  store.openFile(
    {
      path: filePath,
      name: fileName,
      content,
      line: line && line > 0 ? line : undefined
    },
    true
  );

  store.setPanelVisible?.('editor', true);
  store.addToast(`Opened in Editor: ${fileName}`, 'info');
};
