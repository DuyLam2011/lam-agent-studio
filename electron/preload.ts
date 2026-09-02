import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('lamApi', {
  fs: {
    readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    saveFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:saveFile', filePath, content),
    createFile: (dirPath: string, name: string) => ipcRenderer.invoke('fs:createFile', dirPath, name),
    createFolder: (dirPath: string, name: string) => ipcRenderer.invoke('fs:createFolder', dirPath, name),
    delete: (targetPath: string) => ipcRenderer.invoke('fs:delete', targetPath),
    search: (query: string, dirPath: string, options?: { matchCase?: boolean, wholeWord?: boolean }) => ipcRenderer.invoke('fs:search', query, dirPath, options),
    replace: (filePath: string, query: string, replacement: string, options?: { matchCase?: boolean, wholeWord?: boolean }) => ipcRenderer.invoke('fs:replace', filePath, query, replacement, options),
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  settingsAPI: {
    loadSettings: () => ipcRenderer.invoke('settings:load'),
    saveSettings: (data: any) => ipcRenderer.invoke('settings:save', data)
  },
  workspaceAPI: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    pickDirectory: () => ipcRenderer.invoke('dialog:pickDirectory')
  },
  git: {
    status: (repoPath: string) => ipcRenderer.invoke('git:status', repoPath),
    diff: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:diff', repoPath, filePath),
    add: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:add', repoPath, filePath),
    unstage: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:unstage', repoPath, filePath),
    commit: (repoPath: string, message: string, options?: any) => ipcRenderer.invoke('git:commit', repoPath, message, options),
    discard: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:discard', repoPath, filePath),
    getFileContent: (repoPath: string, filePath: string) => ipcRenderer.invoke('git:getFileContent', repoPath, filePath),
    push: (repoPath: string) => ipcRenderer.invoke('git:push', repoPath),
    pull: (repoPath: string, branchName?: string) => ipcRenderer.invoke('git:pull', repoPath, branchName),
    fetch: (repoPath: string) => ipcRenderer.invoke('git:fetch', repoPath),
    branch: (repoPath: string) => ipcRenderer.invoke('git:branch', repoPath),
    checkout: (repoPath: string, branchName: string) => ipcRenderer.invoke('git:checkout', repoPath, branchName),
    clone: (url: string, localPath: string) => ipcRenderer.invoke('git:clone', url, localPath),
  },
  github: {
    login: () => ipcRenderer.invoke('github:login'),
  },
  onWebSocketStatus: (callback: (status: string) => void) => {
    // In a real implementation, we might stream status via IPC, 
    // for now we provide a mock listener hook up point
    ipcRenderer.on('ws-status', (_event, status) => callback(status));
  }
});
