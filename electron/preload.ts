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
    diff: (repoPath: string, filePath?: string) => ipcRenderer.invoke('git:diff', repoPath, filePath),
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
  app: {
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  },
  ollama: {
    checkStatus: (baseUrl?: string) => ipcRenderer.invoke('ollama:checkStatus', baseUrl),
    getEnvironment: () => ipcRenderer.invoke('ollama:getEnvironment'),
    downloadInstaller: () => ipcRenderer.invoke('ollama:downloadInstaller'),
    pullModel: (modelName: string) => ipcRenderer.invoke('ollama:pullModel', modelName),
    onDownloadProgress: (callback: (p: any) => void) => {
      const handler = (_event: any, p: any) => callback(p);
      ipcRenderer.on('ollama:downloadProgress', handler);
      return () => ipcRenderer.removeListener('ollama:downloadProgress', handler);
    },
    onPullProgress: (callback: (p: any) => void) => {
      const handler = (_event: any, p: any) => callback(p);
      ipcRenderer.on('ollama:pullProgress', handler);
      return () => ipcRenderer.removeListener('ollama:pullProgress', handler);
    }
  },
  cloud: {
    validateKey: (provider: string, apiKey: string, baseUrl?: string) =>
      ipcRenderer.invoke('cloud:validateKey', provider, apiKey, baseUrl),
    getModels: (provider: string, apiKey: string, baseUrl?: string) =>
      ipcRenderer.invoke('cloud:getModels', provider, apiKey, baseUrl),
  },
  ai: {
    sendPrompt: (text: string, options?: any) => ipcRenderer.invoke('ai:sendPrompt', text, options),
    executeTool: (toolName: string, args: any) => ipcRenderer.invoke('ai:executeTool', toolName, args),
    onToolCall: (callback: (tool: { name: string, args: any }) => void) => {
      ipcRenderer.on('ai-tool-call', (_event, tool) => callback(tool));
    }
  },
  rules: {
    scanRepoRules: (repoPath: string) => ipcRenderer.invoke('rules:scanRepoRules', repoPath),
    saveRule: (targetRepoPath: string, fileName: string, content: string) =>
      ipcRenderer.invoke('rules:saveRule', targetRepoPath, fileName, content)
  },
  skills: {
    scanRepoSkills: (repoPath: string) => ipcRenderer.invoke('skills:scanRepoSkills', repoPath),
    saveSkill: (targetRepoPath: string, folderName: string, content: string) =>
      ipcRenderer.invoke('skills:saveSkill', targetRepoPath, folderName, content),
  },
  import: {
    fetchGithub: (url: string) => ipcRenderer.invoke('import:fetchGithub', url),
    pickLocalFile: () => ipcRenderer.invoke('import:pickLocalFile'),
  },
  panel: {
    detach: (panelId: string) => ipcRenderer.invoke('panel:detach', panelId),
    redock: (panelId: string) => ipcRenderer.invoke('panel:redock', panelId),
    close: (panelId: string) => ipcRenderer.invoke('panel:close', panelId),
    onRedocked: (callback: (panelId: string) => void) => {
      const handler = (_event: any, panelId: string) => callback(panelId);
      ipcRenderer.on('panel:redocked', handler);
      return () => ipcRenderer.removeListener('panel:redocked', handler);
    },
    onClosed: (callback: (panelId: string) => void) => {
      const handler = (_event: any, panelId: string) => callback(panelId);
      ipcRenderer.on('panel:closed', handler);
      return () => ipcRenderer.removeListener('panel:closed', handler);
    }
  },
  terminal: {
    spawn: (id: string, cwd?: string, cols?: number, rows?: number, shellPath?: string) =>
      ipcRenderer.invoke('terminal:spawn', id, cwd, cols, rows, shellPath),
    getAvailableShells: () => ipcRenderer.invoke('terminal:getAvailableShells'),
    write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
    kill: (id: string) => ipcRenderer.invoke('terminal:kill', id),
    getBuffer: (id: string) => ipcRenderer.invoke('terminal:getBuffer', id),
    onData: (callback: (payload: { id: string; data: string }) => void) => {
      const handler = (_event: any, payload: { id: string; data: string }) => callback(payload);
      ipcRenderer.on('terminal:data', handler);
      return () => ipcRenderer.removeListener('terminal:data', handler);
    },
    onExit: (callback: (payload: { id: string; code: number }) => void) => {
      const handler = (_event: any, payload: { id: string; code: number }) => callback(payload);
      ipcRenderer.on('terminal:exit', handler);
      return () => ipcRenderer.removeListener('terminal:exit', handler);
    }
  },
  security: {
    auditItem: (name: string, type: 'rule' | 'skill' | 'mcp' | 'prompt', content: string) =>
      ipcRenderer.invoke('security:auditItem', name, type, content),
    auditBatch: (items: Array<{ name: string; type: 'rule' | 'skill' | 'mcp' | 'prompt'; content: string }>) =>
      ipcRenderer.invoke('security:auditBatch', items),
  },
  onWebSocketStatus: (callback: (status: string) => void) => {
    // In a real implementation, we might stream status via IPC, 
    // for now we provide a mock listener hook up point
    ipcRenderer.on('ws-status', (_event, status) => callback(status));
  }
});

