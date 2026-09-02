import { create } from 'zustand';

export interface FileNode {
  name: string;
  isDirectory: boolean;
  path?: string;
  isWorkspace?: boolean;
  isIgnored?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SavedWorkspace {
  id: string;
  name: string;
  folders: string[];
}

interface SystemContext {
  cwd: string;
  workspaces: SavedWorkspace[];
  activeWorkspaceId: string | null;
  expandedFolders: Record<string, boolean>;
  fileTree: FileNode[]; // Top level files
  refreshCounter: number;
  showHiddenFiles?: boolean;
  editingWorkspaceId?: string | null;
}

export interface ContextMenuOptions {
  x: number;
  y: number;
  type: 'workspace' | 'repo' | 'folder' | 'file' | 'git_repo' | 'git_file';
  path: string;
  workspaceId: string;
  name: string;
}

interface ActiveRule {
  id: string;
  content: string;
}

interface AgentWorkflow {
  status: 'idle' | 'running' | 'error';
  currentTask: string | null;
}

interface ActiveFile {
  path: string;
  content: string;
  name?: string;
  isDirectory?: boolean;
  originalContent?: string;
  isDiff?: boolean;
  line?: number;
  searchQuery?: string;
  isPreview?: boolean;
}

interface AgentState {
  systemContext: SystemContext;
  activeRules: ActiveRule[];
  workflow: AgentWorkflow;
  wsStatus: string;
  activeFile: ActiveFile | null;
  gitStatuses: Record<string, string>; // Maps absolute file paths to 'M' | 'A' | 'U' | 'D'
  contextMenu: ContextMenuOptions | null;
  activeSidebarTab: 'explorer' | 'search' | 'git';
  searchTarget: string | null;
  searchQuery: string;
  searchFileQuery: string;
  gitTarget: string | null;
  githubToken: string | null;
  githubUser: { avatar_url: string, login: string } | null;
  isAccountModalOpen: boolean;
  isCloneModalOpen: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  openContextMenu: (options: ContextMenuOptions) => void;
  closeContextMenu: () => void;
  setAccountModalOpen: (open: boolean) => void;
  setCloneModalOpen: (open: boolean) => void;
  setGithubToken: (token: string | null) => void;
  setGithubUser: (user: { avatar_url: string, login: string } | null) => void;
  triggerRefresh: () => void;
  toggleHiddenFiles: () => void;
  setEditingWorkspaceId: (id: string | null) => void;
  setActiveSidebarTab: (tab: 'explorer' | 'search' | 'git') => void;
  setSearchTarget: (target: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchFileQuery: (query: string) => void;
  setGitTarget: (target: string | null) => void;
  setGitStatuses: (statuses: Record<string, string>) => void;
  setSystemContext: (context: SystemContext) => void;
  loadSettings: (settings: any) => void;
  createWorkspace: (name: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
  addFolderToWorkspace: (workspaceId: string, folderPath: string) => void;
  toggleFolder: (path: string, expanded: boolean) => void;
  openTabs: ActiveFile[];
  activeTabIndex: number;
  openFile: (file: ActiveFile, forceNewTab?: boolean) => void;
  closeTab: (index: number) => void;
  setActiveTabIndex: (index: number) => void;
  pinTab: (index: number) => void;
  setActiveFile: (file: ActiveFile | null) => void;
  setActiveRules: (rules: ActiveRule[]) => void;
  setWorkflowStatus: (status: AgentWorkflow['status'], task?: string) => void;
  setWsStatus: (status: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  systemContext: { cwd: '/', workspaces: [], activeWorkspaceId: null, expandedFolders: {}, fileTree: [], refreshCounter: 0, showHiddenFiles: false, editingWorkspaceId: null },
  activeRules: [],
  workflow: { status: 'idle', currentTask: null },
  wsStatus: 'disconnected',
  activeFile: null,
  openTabs: [],
  activeTabIndex: -1,
  gitStatuses: {},
  contextMenu: null,
  activeSidebarTab: 'explorer',
  searchTarget: null,
  searchQuery: '',
  searchFileQuery: '',
  gitTarget: null,
  githubToken: null,
  githubUser: null,
  isAccountModalOpen: false,
  isCloneModalOpen: false,
  toasts: [],
  
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  openContextMenu: (options) => set({ contextMenu: options }),
  closeContextMenu: () => set({ contextMenu: null }),
  setAccountModalOpen: (open: boolean) => set({ isAccountModalOpen: open }),
  setCloneModalOpen: (open: boolean) => set({ isCloneModalOpen: open }),
  setGithubToken: (token: string | null) => {
    set({ githubToken: token });
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ githubToken: token });
  },
  setGithubUser: (user) => set({ githubUser: user }),
  triggerRefresh: () => set((state) => ({ systemContext: { ...state.systemContext, refreshCounter: state.systemContext.refreshCounter + 1 } })),
  toggleHiddenFiles: () => set((state) => {
    const showHiddenFiles = !state.systemContext.showHiddenFiles;
    const newContext = { ...state.systemContext, showHiddenFiles };
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ showHiddenFiles });
    return { systemContext: newContext };
  }),
  setEditingWorkspaceId: (id) => set((state) => ({ systemContext: { ...state.systemContext, editingWorkspaceId: id } })),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setSearchTarget: (target) => set({ searchTarget: target }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchFileQuery: (query) => set({ searchFileQuery: query }),
  setGitTarget: (target) => set({ gitTarget: target }),
  setGitStatuses: (statuses) => set({ gitStatuses: statuses }),
  
  setSystemContext: (context) => set({ systemContext: context }),
  
  loadSettings: (settings) => set((state) => ({
    systemContext: {
      ...state.systemContext,
      workspaces: settings.workspaces || [],
      activeWorkspaceId: settings.activeWorkspaceId || null,
    },
    githubToken: settings.githubToken || null,
  })),

  createWorkspace: (name) => set((state) => {
    const newWs = { id: Date.now().toString(), name, folders: [] };
    const workspaces = [...state.systemContext.workspaces, newWs];
    
    // @ts-ignore - persist to backend
    window.lamApi?.settingsAPI?.saveSettings({ workspaces, activeWorkspaceId: newWs.id });
    
    return {
      systemContext: {
        ...state.systemContext,
        workspaces,
        activeWorkspaceId: newWs.id,
      }
    };
  }),

  renameWorkspace: (workspaceId, name) => set((state) => {
    const workspaces = state.systemContext.workspaces.map(ws => 
      ws.id === workspaceId ? { ...ws, name } : ws
    );
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ workspaces });
    return { systemContext: { ...state.systemContext, workspaces } };
  }),

  deleteWorkspace: (workspaceId) => set((state) => {
    const workspaces = state.systemContext.workspaces.filter(ws => ws.id !== workspaceId);
    let activeWorkspaceId = state.systemContext.activeWorkspaceId;
    if (activeWorkspaceId === workspaceId) {
      activeWorkspaceId = workspaces.length > 0 ? workspaces[0].id : null;
    }
    // @ts-ignore
    window.lamApi?.settingsAPI?.saveSettings({ workspaces, activeWorkspaceId });
    return { systemContext: { ...state.systemContext, workspaces, activeWorkspaceId } };
  }),

  addFolderToWorkspace: (workspaceId, folderPath) => set((state) => {
    const workspaces = state.systemContext.workspaces.map(ws => {
      if (ws.id === workspaceId) {
        return { ...ws, folders: [...new Set([...ws.folders, folderPath])] };
      }
      return ws;
    });
    
    // @ts-ignore - persist to backend
    window.lamApi?.settingsAPI?.saveSettings({ workspaces });
    
    return {
      systemContext: { ...state.systemContext, workspaces }
    };
  }),
  toggleFolder: (path, expanded) => set((state) => ({ 
    systemContext: { ...state.systemContext, expandedFolders: { ...state.systemContext.expandedFolders, [path]: expanded } } 
  })),
  openFile: (file, forceNewTab = false) => set((state) => {
    // If already open, switch to it
    const existingIndex = state.openTabs.findIndex(t => t.path === file.path);
    if (existingIndex >= 0) {
      const updatedTabs = [...state.openTabs];
      updatedTabs[existingIndex] = { ...updatedTabs[existingIndex], ...file, isPreview: forceNewTab ? false : updatedTabs[existingIndex].isPreview };
      return { openTabs: updatedTabs, activeTabIndex: existingIndex, activeFile: updatedTabs[existingIndex] };
    }

    const newFile = { ...file, isPreview: !forceNewTab };
    let newTabs = [...state.openTabs];
    let newIndex = state.activeTabIndex;

    if (!forceNewTab) {
      const previewIndex = newTabs.findIndex(t => t.isPreview);
      if (previewIndex >= 0) {
        newTabs[previewIndex] = newFile;
        newIndex = previewIndex;
      } else {
        newTabs.push(newFile);
        newIndex = newTabs.length - 1;
      }
    } else {
      newTabs.push(newFile);
      newIndex = newTabs.length - 1;
    }

    return { openTabs: newTabs, activeTabIndex: newIndex, activeFile: newFile };
  }),
  closeTab: (index) => set((state) => {
    const newTabs = [...state.openTabs];
    newTabs.splice(index, 1);
    let newIndex = state.activeTabIndex;
    if (index === state.activeTabIndex) {
      newIndex = Math.max(0, index - 1);
    } else if (index < state.activeTabIndex) {
      newIndex--;
    }
    const newActiveFile = newTabs.length > 0 ? newTabs[newIndex] : null;
    return { openTabs: newTabs, activeTabIndex: newIndex, activeFile: newActiveFile };
  }),
  setActiveTabIndex: (index) => set((state) => ({
    activeTabIndex: index,
    activeFile: state.openTabs[index] || null
  })),
  pinTab: (index) => set((state) => {
    const newTabs = [...state.openTabs];
    if (newTabs[index]) {
      newTabs[index] = { ...newTabs[index], isPreview: false };
      return { openTabs: newTabs, activeFile: state.activeTabIndex === index ? newTabs[index] : state.activeFile };
    }
    return {};
  }),
  setActiveFile: (file) => {
    if (file === null) {
      set({ openTabs: [], activeTabIndex: -1, activeFile: null });
    } else {
      useAgentStore.getState().openFile(file, false);
    }
  },
  setActiveRules: (rules) => set({ activeRules: rules }),
  setWorkflowStatus: (status, task = null) => 
    set((state) => ({ workflow: { status, currentTask: task ?? state.workflow.currentTask } })),
  setWsStatus: (status) => set({ wsStatus: status }),
}));
