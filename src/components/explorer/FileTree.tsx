import React from 'react';
import { useAgentStore, FileNode } from '../../store/useAgentStore';
import { FileTreeItem } from './FileTreeItem';

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
        <FileTreeItem
          key={`${parentPath}/${file.name}-${idx}`}
          file={file}
          parentPath={parentPath}
          workspaceId={workspaceId}
          isRootRepo={isRootRepo}
        />
      ))}
    </ul>
  );
};
