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
    listWorkspaceFiles: (rootDir: string, maxFiles?: number) => ipcRenderer.invoke('fs:listWorkspaceFiles', rootDir, maxFiles),
    packFolderContext: (folderPath: string, maxFiles?: number) => ipcRenderer.invoke('fs:packFolderContext', folderPath, maxFiles),
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  settingsAPI: {
    loadSettings: () => ipcRenderer.invoke('settings:load'),
    saveSettings: (data: any) => ipcRenderer.invoke('settings:save', data),
    getStorageInfo: () => ipcRenderer.invoke('settings:getStorageInfo'),
    openSettingsFolder: () => ipcRenderer.invoke('settings:openSettingsFolder')
  },
  themeAPI: {
    loadConfig: () => ipcRenderer.invoke('theme:loadConfig'),
    saveConfig: (data: any) => ipcRenderer.invoke('theme:saveConfig', data),
    getStorageInfo: () => ipcRenderer.invoke('theme:getStorageInfo'),
    openFolder: () => ipcRenderer.invoke('theme:openFolder'),
    listPresets: () => ipcRenderer.invoke('theme:listPresets'),
    savePreset: (id: string, preset: any) => ipcRenderer.invoke('theme:savePreset', id, preset)
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
    getComprehensiveReviewContext: (repoPath: string, targetRef?: string) => ipcRenderer.invoke('git:getComprehensiveReviewContext', repoPath, targetRef),
  },
  github: {
    login: () => ipcRenderer.invoke('github:login'),
  },
  google: {
    getStatus: () => ipcRenderer.invoke('google:getStatus'),
    login: (email?: string) => ipcRenderer.invoke('google:login', email),
    disconnect: () => ipcRenderer.invoke('google:disconnect'),
  },
  codex: {
    getStatus: () => ipcRenderer.invoke('codex:getStatus'),
    login: () => ipcRenderer.invoke('codex:login'),
    disconnect: () => ipcRenderer.invoke('codex:disconnect'),
    openApp: () => ipcRenderer.invoke('codex:openApp'),
  },
  claude: {
    getStatus: () => ipcRenderer.invoke('claude:getStatus'),
    login: () => ipcRenderer.invoke('claude:login'),
    disconnect: () => ipcRenderer.invoke('claude:disconnect'),
    setDirectKey: (key: string) => ipcRenderer.invoke('claude:setDirectKey', key),
  },
  modelDiscovery: {
    discoverModels: (provider: string) => ipcRenderer.invoke('engine:discoverModels', provider),
    assignFatherAgent: (provider: string, modelId: string) => ipcRenderer.invoke('engine:assignFatherAgent', provider, modelId),
  },
  delegation: {
    createContract: (userGoal: string, fileContext?: string, fatherModel?: string, codingEngine?: string) =>
      ipcRenderer.invoke('delegation:createContract', userGoal, fileContext, fatherModel, codingEngine),
    verifyExecution: (contract: any, diffSummary?: string, testOutput?: string) =>
      ipcRenderer.invoke('delegation:verifyExecution', contract, diffSummary, testOutput),
    updateContractStatus: (contractId: string, status: string) =>
      ipcRenderer.invoke('delegation:updateContractStatus', contractId, status),
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
    },
    cancelRun: (runId: string) => ipcRenderer.invoke('ai:cancelRun', runId),
    onAgentEvent: (callback: (event: any) => void) => {
      const handler = (_event: any, payload: any) => callback(payload);
      ipcRenderer.on('ai:agentEvent', handler);
      return () => ipcRenderer.removeListener('ai:agentEvent', handler);
    }
  },
  rules: {
    scanRepoRules: (repoPath: string) => ipcRenderer.invoke('rules:scanRepoRules', repoPath),
    saveRule: (targetRepoPath: string, fileName: string, content: string) =>
      ipcRenderer.invoke('rules:saveRule', targetRepoPath, fileName, content),
    getCompiledRules: (workspacePath: string) => ipcRenderer.invoke('rules:getCompiledRules', workspacePath),
  },
  skills: {
    scanRepoSkills: (repoPath: string) => ipcRenderer.invoke('skills:scanRepoSkills', repoPath),
    saveSkill: (targetRepoPath: string, folderName: string, content: string) =>
      ipcRenderer.invoke('skills:saveSkill', targetRepoPath, folderName, content),
    getCompiledSkills: (workspacePath: string) => ipcRenderer.invoke('skills:getCompiledSkills', workspacePath),
  },
  agent: {
    verifyInvariants: (workspaceRoot: string, options?: any) => ipcRenderer.invoke('agent:verifyInvariants', workspaceRoot, options),
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
    getEnvironments: () => ipcRenderer.invoke('terminal:getEnvironments'),
    getRecentAgentRuns: () => ipcRenderer.invoke('terminal:getRecentAgentRuns'),
    executeAgentCommand: (params: any) => ipcRenderer.invoke('terminal:executeAgentCommand', params),
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
    auditItem: (name: string, type: 'rule' | 'skill' | 'mcp' | 'prompt', content: string) => ipcRenderer.invoke('security:auditItem', name, type, content),
    auditBatch: (items: Array<{ name: string; type: 'rule' | 'skill' | 'mcp' | 'prompt'; content: string }>) => ipcRenderer.invoke('security:auditBatch', items),
  },
  sandbox: {
    validateLink: (url: string, config?: any) => ipcRenderer.invoke('sandbox:validateLink', url, config),
    runScript: (script: string, language: 'javascript' | 'bash', workspaceRoot: string, config?: any) =>
      ipcRenderer.invoke('sandbox:runScript', script, language, workspaceRoot, config),
    clearSandbox: (workspaceRoot: string) => ipcRenderer.invoke('sandbox:clearSandbox', workspaceRoot),
  },
  graph: {
    get: (workspaceRoot?: string) => ipcRenderer.invoke('graph:get', workspaceRoot),
    build: (workspaceRoot?: string, memories?: any[]) => ipcRenderer.invoke('graph:build', workspaceRoot, memories),
    query: (query: string, workspaceRoot?: string) => ipcRenderer.invoke('graph:query', workspaceRoot, query),
  },
  contextBatch: {
    getUnifiedBatch: (workspaceRoot?: string) => ipcRenderer.invoke('contextBatch:getUnifiedBatch', workspaceRoot),
    publishReview: (reviewData: any) => ipcRenderer.invoke('contextBatch:publishReview', reviewData),
  },
  storage: {
    listConversations: () => ipcRenderer.invoke('storage:listConversations'),
    getConversation: (id: string) => ipcRenderer.invoke('storage:getConversation', id),
    saveConversation: (conv: any) => ipcRenderer.invoke('storage:saveConversation', conv),
    deleteConversation: (id: string) => ipcRenderer.invoke('storage:deleteConversation', id),
    loadMemories: (workspacePath?: string) => ipcRenderer.invoke('storage:loadMemories', workspacePath),
    saveMemories: (memories: any[], workspacePath?: string) => ipcRenderer.invoke('storage:saveMemories', memories, workspacePath),
    getMemoryFolderTree: (workspacePath?: string) => ipcRenderer.invoke('storage:getMemoryFolderTree', workspacePath),
    openMemoryFile: (workspacePath: string, relativePath: string) => ipcRenderer.invoke('storage:openMemoryFile', workspacePath, relativePath),
  },
  browser: {
    navigate: (url: string) => ipcRenderer.invoke('browser:navigate', url),
    inspectElement: (selector: string) => ipcRenderer.invoke('browser:inspectElement', selector),
    getConsoleLogs: () => ipcRenderer.invoke('browser:getConsoleLogs'),
    captureScreenshot: () => ipcRenderer.invoke('browser:captureScreenshot'),
    evalScript: (code: string) => ipcRenderer.invoke('browser:evalScript', code),
    auditPerformance: (url?: string) => ipcRenderer.invoke('browser:auditPerformance', url),
  },
  system: {
    getMetrics: () => ipcRenderer.invoke('system:getMetrics'),
    runBenchmark: () => ipcRenderer.invoke('system:runBenchmark'),
    optimizeResources: () => ipcRenderer.invoke('system:optimizeResources'),
  },
  gateway: {
    getHealth: () => ipcRenderer.invoke('gateway:getHealth'),
    getConfig: () => ipcRenderer.invoke('gateway:getConfig'),
    saveConfig: (gatewayUrl: string) => ipcRenderer.invoke('gateway:saveConfig', gatewayUrl),
    syncProfiles: (workspaceId: string, profiles: any) => ipcRenderer.invoke('gateway:syncProfiles', workspaceId, profiles),
    pullProfiles: (workspaceId: string) => ipcRenderer.invoke('gateway:pullProfiles', workspaceId),
    syncSettings: (workspaceId: string, settings: any) => ipcRenderer.invoke('gateway:syncSettings', workspaceId, settings),
    pullSettings: (workspaceId: string) => ipcRenderer.invoke('gateway:pullSettings', workspaceId),
    emitCallback: (kind: string, payload: any) => ipcRenderer.invoke('gateway:emitCallback', kind, payload),
    getEvents: (type?: string, limit?: number) => ipcRenderer.invoke('gateway:getEvents', type, limit),
    onAuthCallback: (cb: (data: any) => void) => {
      const handler = (_ev: any, data: any) => cb(data);
      ipcRenderer.on('gateway:authCallback', handler);
      return () => ipcRenderer.removeListener('gateway:authCallback', handler);
    },
  },
  updates: {
    check: (channel?: string) => ipcRenderer.invoke('updates:check', channel),
    install: (artifact: any, workspaceRoot?: string) => ipcRenderer.invoke('updates:install', artifact, workspaceRoot),
    publishVendor: (params: any) => ipcRenderer.invoke('updates:publishVendor', params),
    onInstalled: (cb: (res: any) => void) => {
      const handler = (_ev: any, res: any) => cb(res);
      ipcRenderer.on('updates:installed', handler);
      return () => ipcRenderer.removeListener('updates:installed', handler);
    },
  },
  externalAgents: {
    scan: (maxPerProvider?: number, force = true) => ipcRenderer.invoke('externalAgents:scan', maxPerProvider, force),
    getFatherContext: (maxPerProvider?: number) => ipcRenderer.invoke('externalAgents:getFatherContext', maxPerProvider),
    pushToGateway: (workspaceRoot?: string) => ipcRenderer.invoke('externalAgents:pushToGateway', workspaceRoot),
  },
  fatherWindow: {
    open: (initialPrompt?: string) => ipcRenderer.invoke('fatherWindow:open', initialPrompt),
    onPrompt: (cb: (prompt: string) => void) => {
      const handler = (_ev: any, prompt: string) => cb(prompt);
      ipcRenderer.on('father:prompt', handler);
      return () => ipcRenderer.removeListener('father:prompt', handler);
    },
  },
  onWebSocketStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('ws-status', (_event, status) => callback(status));
  }
});

