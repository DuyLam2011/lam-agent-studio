import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAgentStore } from '../../store/useAgentStore';
import { FilePlus, FolderPlus, Folder, Trash2, XCircle, Pencil, Bot, Search, FolderGit2, Target, Paperclip, Sparkles, ShieldCheck, Code2 } from 'lucide-react';
import { triggerExplainInChat, triggerReviewInChat } from '../../services/workspace/editorContextService';
import { packFolderContext, openFileInEditor } from '../../services/workspace/workspaceFileService';
import { resolveWorkspaceRepoInfo } from '../../services/workspace/workspaceRepoResolver';

export const GlobalContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu, triggerRefresh, deleteWorkspace, addFolderToWorkspace, setEditingWorkspaceId, setActiveSidebarTab, setSearchTarget, setGitTarget, addToast } = useAgentStore();
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptData, setPromptData] = useState<{ action: string, type: 'file' | 'folder' } | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (contextMenu && !isPrompting) {
      const close = () => closeContextMenu();
      setTimeout(() => document.addEventListener('click', close), 0);
      return () => document.removeEventListener('click', close);
    }
  }, [contextMenu, isPrompting, closeContextMenu]);

  if (!contextMenu) return null;

  const handleAction = async (action: 'new_file' | 'new_folder' | 'remove_repo' | 'delete') => {
    if (action === 'new_file' || action === 'new_folder') {
      setIsPrompting(true);
      setPromptData({ action, type: action === 'new_file' ? 'file' : 'folder' });
      return;
    }

    if (action === 'remove_repo') {
      if (confirm(`Remove "${contextMenu.name}" from this workspace?`)) {
        const state = useAgentStore.getState();
        const ws = state.systemContext.workspaces.find(w => w.id === contextMenu.workspaceId);
        if (ws) {
          const newFolders = ws.folders.filter(f => f !== contextMenu.path);
          const newWsList = state.systemContext.workspaces.map(w => w.id === ws.id ? { ...w, folders: newFolders } : w);
          // @ts-ignore
          window.lamApi?.settingsAPI?.saveSettings({ workspaces: newWsList });
          useAgentStore.setState({ systemContext: { ...state.systemContext, workspaces: newWsList } });
        }
      }
      closeContextMenu();
      return;
    }

    if (action === 'delete') {
      if (confirm(`Permanently delete "${contextMenu.name}" from disk? WARNING: This cannot be undone.`)) {
        try {
          // @ts-ignore
          await window.lamApi?.fs?.delete(contextMenu.path);
          triggerRefresh();
          
          // If it was a root repo, also clean it from the workspace settings
          if (contextMenu.type === 'repo') {
            const state = useAgentStore.getState();
            const ws = state.systemContext.workspaces.find(w => w.id === contextMenu.workspaceId);
            if (ws) {
              const newFolders = ws.folders.filter(f => f !== contextMenu.path);
              const newWsList = state.systemContext.workspaces.map(w => w.id === ws.id ? { ...w, folders: newFolders } : w);
              // @ts-ignore
              window.lamApi?.settingsAPI?.saveSettings({ workspaces: newWsList });
              useAgentStore.setState({ systemContext: { ...state.systemContext, workspaces: newWsList } });
            }
          }
        } catch (error) {
          addToast('Failed to delete: ' + error, 'error');
        }
      }
      closeContextMenu();
    }
  };

  const submitPrompt = async () => {
    if (!inputValue.trim() || !promptData) return;
    try {
      const fullPath = `${contextMenu.path}/${inputValue.trim()}`;
      if (promptData.type === 'file') {
        // @ts-ignore
        await window.lamApi?.fs?.createFile(fullPath);
      } else {
        // @ts-ignore
        await window.lamApi?.fs?.createFolder(fullPath);
      }
      triggerRefresh();
    } catch (error) {
      addToast('Failed to create: ' + error, 'error');
    }
    setIsPrompting(false);
    setInputValue('');
    closeContextMenu();
  };

  const renderMenuContent = () => {
    if (isPrompting) {
      return (
        <div className="p-2 w-56 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-gray-400">Name for new {promptData?.type}:</span>
          <input 
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitPrompt();
              if (e.key === 'Escape') { setIsPrompting(false); closeContextMenu(); }
            }}
            className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary/50"
          />
          <div className="flex gap-2 justify-end mt-1">
            <button onClick={() => { setIsPrompting(false); closeContextMenu(); }} className="text-xs text-gray-400 hover:text-white px-2 py-1">Cancel</button>
            <button onClick={submitPrompt} className="text-xs bg-primary/20 text-primary hover:bg-primary/40 px-2 py-1 rounded transition-colors">Create</button>
          </div>
        </div>
      );
    }

    if (contextMenu.type === 'workspace') {
      return (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); closeContextMenu(); setEditingWorkspaceId(contextMenu.workspaceId); }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Pencil size={12} /> Rename Workspace
          </button>
          <button 
            onClick={async (e) => { 
              e.stopPropagation(); 
              closeContextMenu(); 
              // @ts-ignore
              const result = await window.lamApi?.workspaceAPI?.openDirectory();
              if (result && !result.canceled) addFolderToWorkspace(contextMenu.workspaceId, result.folderPath);
            }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FolderPlus size={12} /> Add Repository
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); closeContextMenu(); addToast('Agent assignment coming soon!', 'info'); }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Bot size={12} /> Assign Agents
          </button>
          <div className="h-px bg-white/10 my-1 mx-2"></div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              closeContextMenu(); 
              setGitTarget(contextMenu.workspaceId);
              setActiveSidebarTab('git');
            }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FolderGit2 size={12} /> Git Source Control
          </button>
          <div className="h-px bg-white/10 my-1 mx-2"></div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              closeContextMenu(); 
              useAgentStore.getState().setSearchTarget(contextMenu.workspaceId);
              useAgentStore.getState().setActiveSidebarTab('search');
            }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Search size={12} /> Agent track down
          </button>
          <div className="h-px bg-white/10 my-1 mx-2"></div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              closeContextMenu(); 
              if (confirm(`Delete workspace "${contextMenu.name}"?`)) deleteWorkspace(contextMenu.workspaceId);
            }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <Trash2 size={12} /> Delete Workspace
          </button>
        </>
      );
    }

    if (contextMenu.type === 'git_repo') {
      return (
        <>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setGitTarget(contextMenu.path);
              closeContextMenu(); 
            }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors font-bold"
          >
            <Target size={12} /> Git control focus
          </button>
          <div className="h-px bg-white/10 my-1 mx-2"></div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              useAgentStore.getState().setPanelVisible('agent', true);
              useAgentStore.getState().setPendingChatPrompt(`@backend-reviewer Review git repository changes in \`${contextMenu.path}\` and assist Father Agent in remediating issues.`);
              addToast('Assigned @backend-reviewer to review repository in chat', 'info');
              closeContextMenu(); 
            }}
            className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors font-medium"
          >
            <Bot size={12} /> Assign Agent to Review in Chat
          </button>
        </>
      );
    }

    if (contextMenu.type === 'git_file') {
      return (
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            const repoPath = contextMenu.repoPath || contextMenu.path.substring(0, contextMenu.path.lastIndexOf('/'));
            const filePath = contextMenu.name;
            useAgentStore.getState().setPanelVisible('agent', true);
            useAgentStore.getState().setPendingChatPrompt(`@backend-reviewer Review git file \`${filePath}\` in \`${repoPath}\` and assist Father Agent in fixing issues.`);
            addToast(`Assigned @backend-reviewer to review ${filePath} in chat`, 'info');
            closeContextMenu(); 
          }}
          className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors font-medium"
        >
          <Bot size={12} /> Assign Agent to Review in Chat
        </button>
      );
    }

    return (
      <>
        {(contextMenu.type === 'repo' || contextMenu.type === 'folder') && (
          <>
            <button onClick={(e) => { e.stopPropagation(); handleAction('new_file'); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
              <FilePlus size={12} /> New File
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleAction('new_folder'); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
              <FolderPlus size={12} /> New Folder
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                closeContextMenu();
                await packFolderContext(contextMenu.path, contextMenu.name);
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors font-bold"
            >
              <Folder size={12} /> Add Folder to Agents Context
            </button>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
          </>
        )}
        
        {contextMenu.type === 'repo' && (
          <>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                closeContextMenu(); 
                setSearchTarget(contextMenu.path);
                setActiveSidebarTab('search');
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Search size={12} /> Agent track down
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                closeContextMenu(); 
                setGitTarget(contextMenu.path);
                setActiveSidebarTab('git');
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <FolderGit2 size={12} /> Git Source Control
            </button>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
            <button onClick={(e) => { e.stopPropagation(); handleAction('remove_repo'); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-colors">
              <XCircle size={12} /> Remove from Workspace
            </button>
          </>
        )}

        {contextMenu.type === 'file' && (
          <>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                openFileInEditor(contextMenu.path, contextMenu.name);
                closeContextMenu(); 
              }} 
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors font-semibold"
            >
              <Code2 size={12} className="text-primary" /> Open in Editor
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                try {
                  const state = useAgentStore.getState();
                  const info = resolveWorkspaceRepoInfo(contextMenu.path, state.systemContext.workspaces, state.systemContext.activeWorkspaceId, state.systemContext.cwd);
                  state.addContextAttachment({
                    id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    name: contextMenu.name,
                    path: contextMenu.path,
                    rootPath: info.rootPath,
                    workspaceRepoTag: info.tag,
                    type: 'file',
                    tokenEstimate: 200
                  });
                  state.addToast(`Attached ${contextMenu.name} (${info.tag}) to Agents Context`, 'success');
                } catch(err) {}
                closeContextMenu(); 
              }} 
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors font-bold"
            >
              <Paperclip size={12} /> Add to Agents Context
            </button>
            <button 
              onClick={async (e) => { 
                e.stopPropagation(); 
                try {
                  // @ts-ignore
                  const res = await window.lamApi?.fs?.readFile(contextMenu.path);
                  if (res?.success) {
                    useAgentStore.getState().openFile({
                      path: contextMenu.path,
                      content: res.data,
                      name: contextMenu.name,
                      isDirectory: false
                    }, true);
                  }
                } catch(err) {}
                closeContextMenu(); 
              }} 
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-primary hover:bg-primary/20 transition-colors font-semibold"
            >
              <FilePlus size={12} /> Add to New File Tab
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                closeContextMenu();
                try {
                  // @ts-ignore
                  const res = await window.lamApi?.fs?.readFile(contextMenu.path);
                  const content = res?.success ? res.data : '';
                  triggerExplainInChat({ path: contextMenu.path, name: contextMenu.name, content });
                } catch(err) {}
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              <Sparkles size={12} /> Explain with AI
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                closeContextMenu();
                try {
                  // @ts-ignore
                  const res = await window.lamApi?.fs?.readFile(contextMenu.path);
                  const content = res?.success ? res.data : '';
                  triggerReviewInChat({ path: contextMenu.path, name: contextMenu.name, content });
                } catch(err) {}
              }}
              className="w-full flex items-center gap-2 text-left px-4 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <ShieldCheck size={12} /> Review with AI
            </button>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
          </>
        )}

        <button onClick={(e) => { e.stopPropagation(); handleAction('delete'); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors">
          <Trash2 size={12} /> Delete from Disk
        </button>
      </>
    );
  };

  return createPortal(
    <div 
      className="fixed surface-dropdown shadow-2xl overflow-hidden z-[9999] py-1 min-w-[192px] animate-in fade-in zoom-in-95 duration-100"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {renderMenuContent()}
    </div>,
    document.body
  );
};
