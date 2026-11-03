import React, { useState, useEffect } from 'react';
import { ChevronRight, Paperclip, Code2 } from 'lucide-react';
import { useAgentStore, FileNode } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { getFileIcon } from './fileIconHelper';
import { FileTree } from './FileTree';
import { packFolderContext, openFileInEditor } from '../../services/workspace/workspaceFileService';
import { resolveWorkspaceRepoInfo } from '../../services/workspace/workspaceRepoResolver';

interface FileTreeItemProps {
  file: FileNode;
  parentPath: string;
  workspaceId: string;
  isRootRepo?: boolean;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({ file, parentPath, workspaceId, isRootRepo }) => {
  const currentPath = file.path || (parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`);
  const { systemContext, toggleFolder, setActiveWorkspace, openContextMenu, gitStatuses, setActiveRepoPath } = useAgentStore();
  const [children, setChildren] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isExpanded = systemContext.expandedFolders[currentPath] || false;

  const gitStatus = gitStatuses[currentPath];
  const colorClass = gitStatus === 'M' ? 'text-yellow-400' : gitStatus === 'U' || gitStatus === 'A' ? 'text-green-400' : gitStatus === 'D' ? 'text-red-400' : 'text-gray-300';

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const res = await window.lamApi?.fs?.readDirectory(currentPath);
      if (res?.success) setChildren(res.data);
    } catch (error) {
      console.error("Failed to read directory", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (file.isDirectory && isExpanded) fetchDirectory();
  }, [isExpanded, systemContext.refreshCounter]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (workspaceId && systemContext.activeWorkspaceId !== workspaceId) {
      setActiveWorkspace(workspaceId);
      useConversationStore.getState().switchWorkspaceConversation(workspaceId);
    }
    if (isRootRepo) {
      setActiveRepoPath(currentPath);
    }

    if (file.isDirectory) {
      if (!isExpanded && children.length === 0) await fetchDirectory();
      toggleFolder(currentPath, !isExpanded);
    } else {
      await openFileInEditor(currentPath, file.name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: isRootRepo ? 'repo' : (file.isDirectory ? 'folder' : 'file'),
      path: currentPath,
      workspaceId,
      name: file.name,
    });
  };

  const handleAddToContext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const state = useAgentStore.getState();
    if (file.isDirectory) {
      await packFolderContext(currentPath, file.name);
      return;
    }
    const info = resolveWorkspaceRepoInfo(currentPath, state.systemContext.workspaces, state.systemContext.activeWorkspaceId, state.systemContext.cwd);
    state.addContextAttachment({
      id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: file.name,
      path: currentPath,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'file',
      tokenEstimate: 200
    });
    state.addToast(`Attached ${file.name} (${info.tag}) to Agents Context`, 'success');
  };

  return (
    <li className="select-none" onContextMenu={handleContextMenu}>
      <div 
        className="group flex items-center justify-between hover:bg-white/5 rounded px-1 transition-colors select-none py-1 flex-1 min-w-0 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="w-4 shrink-0 flex justify-center">
            {file.isDirectory && (
              <ChevronRight 
                size={14} 
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-white' : 'text-gray-500'}`} 
              />
            )}
          </div>
          {getFileIcon(file.name)}
          <span className={`text-xs truncate ${colorClass}`}>{file.name}</span>
        </div>

        {!file.isDirectory && (
          <div className="flex items-center gap-1 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); openFileInEditor(currentPath, file.name); }}
              className="p-0.5 rounded hover:bg-primary/20 text-gray-400 hover:text-primary transition-all"
              title="Open in Editor"
            >
              <Code2 size={11} />
            </button>
            <button
              onClick={handleAddToContext}
              className="p-0.5 rounded hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 transition-all"
              title="Add to Agents Conversation Context"
            >
              <Paperclip size={11} />
            </button>
          </div>
        )}
      </div>

      {file.isDirectory && isExpanded && (
        <div className="pl-4 mt-1 border-l border-white/10 ml-2">
          {isLoading ? (
            <div className="text-[10px] text-gray-500 italic py-1">Loading...</div>
          ) : (
            <FileTree files={children} parentPath={currentPath} workspaceId={workspaceId} />
          )}
        </div>
      )}
    </li>
  );
};
