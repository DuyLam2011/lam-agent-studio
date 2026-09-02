import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, Box, FileJson, FileType2, FileText, Image as ImageIcon, FileCode2, FileTerminal } from 'lucide-react';
import { useAgentStore, FileNode } from '../store/useAgentStore';

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

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileType2 size={14} className="text-blue-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileType2 size={14} className="text-yellow-400 shrink-0" />;
    case 'json':
      return <FileJson size={14} className="text-yellow-200 shrink-0" />;
    case 'css':
      return <FileCode2 size={14} className="text-blue-300 shrink-0" />;
    case 'html':
      return <FileCode size={14} className="text-orange-400 shrink-0" />;
    case 'md':
      return <FileText size={14} className="text-purple-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <ImageIcon size={14} className="text-green-400 shrink-0" />;
    case 'sh':
    case 'bat':
    case 'cmd':
      return <FileTerminal size={14} className="text-green-300 shrink-0" />;
    default:
      return <FileCode size={14} className="text-gray-400 shrink-0" />;
  }
};

const FileTreeItem: React.FC<FileTreeItemProps> = ({ file, parentPath, workspaceId, isRootRepo }) => {
  const currentPath = file.path || (parentPath === '/' ? `/${file.name}` : `${parentPath}/${file.name}`);
  const { systemContext, toggleFolder, setActiveFile, openContextMenu, gitStatuses } = useAgentStore();
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
      if (res?.success) {
        setChildren(res.data);
      }
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
    if (file.isDirectory) {
      if (!isExpanded && children.length === 0) {
        await fetchDirectory();
      }
      toggleFolder(currentPath, !isExpanded);
    } else {
      // It's a file, fetch content and set as active
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

  const handleGitTrackDown = () => {
    setGitTarget(currentPath);
    setActiveSidebarTab('git');
    closeContextMenu();
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
      onGitTrackDown: handleGitTrackDown
    });
  };

  return (
    <li className="select-none" onContextMenu={handleContextMenu}>
      <div 
        className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 transition-colors select-none py-1 flex-1 min-w-0"
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
        
        {file.isDirectory ? (
          file.isWorkspace ? (
            <Box size={14} className="text-purple-400 shrink-0" />
          ) : (
            isExpanded ? <FolderOpen size={14} className="text-blue-400 shrink-0" /> : <Folder size={14} className="text-blue-400 shrink-0" />
          )
        ) : (
          <>
            {getFileIcon(file.name)}
          </>
        )}
        
        <span className={`truncate text-xs ${gitStatus ? colorClass : (file.isIgnored ? 'text-gray-600' : 'text-gray-300')}`}>
          {file.name}
        </span>

        {gitStatus && !file.isDirectory && (
          <span className={`font-mono text-[9px] font-bold ml-auto mr-1 shrink-0 ${colorClass}`}>
            {gitStatus}
          </span>
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
