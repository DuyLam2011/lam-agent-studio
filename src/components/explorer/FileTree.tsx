import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAgentStore, FileNode } from '../../store/useAgentStore';
import { useConversationStore } from '../../store/useConversationStore';
import { getFileIcon } from './fileIconHelper';

interface FileTreeProps {
  files: FileNode[];
  parentPath: string;
  workspaceId: string;
  isRootRepo?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, parentPath, workspaceId, isRootRepo }) => {
  const { systemContext } = useAgentStore();
  const showHiddenFiles = systemContext.showHiddenFiles ?? false;
  const filteredFiles = showHiddenFiles ? files : files.filter(f => !f.name.startsWith('.'));

  return (
    <ul className="space-y-1">
      {filteredFiles.map((file, idx) => (
        <FileTreeItem key={`${parentPath}/${file.name}-${idx}`} file={file} parentPath={parentPath} workspaceId={workspaceId} isRootRepo={isRootRepo} />
      ))}
    </ul>
  );
};

interface FileTreeItemProps {
  file: FileNode;
  parentPath: string;
  workspaceId: string;
  isRootRepo?: boolean;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ file, parentPath, workspaceId, isRootRepo }) => {
  const currentPath = file.path || (parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`);
  const { systemContext, toggleFolder, setActiveFile, setActiveWorkspace, openContextMenu, gitStatuses } = useAgentStore();
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
    if (file.isDirectory && isExpanded) {
      fetchDirectory();
    }
  }, [isExpanded, systemContext.refreshCounter]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Auto-switch workspace & conversation if clicking an item in a different workspace
    if (workspaceId && systemContext.activeWorkspaceId !== workspaceId) {
      setActiveWorkspace(workspaceId);
      useConversationStore.getState().switchWorkspaceConversation(workspaceId);
    }

    if (file.isDirectory) {
      if (!isExpanded && children.length === 0) {
        await fetchDirectory();
      }
      toggleFolder(currentPath, !isExpanded);
    } else {
      try {
        // @ts-ignore
        const res = await window.lamApi?.fs?.readFile(currentPath);
        if (res?.success) {
          setActiveFile({ path: currentPath, content: res.data });
        }
      } catch (error) {
        console.error("Failed to read file", error);
      }
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

  return (
    <li className="select-none" onContextMenu={handleContextMenu}>
      <div 
        className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 rounded px-1 transition-colors select-none py-1 flex-1 min-w-0"
        onClick={handleToggle}
      >
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
