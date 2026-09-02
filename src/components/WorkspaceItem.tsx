import React, { useState, useRef, useEffect } from 'react';
import { Box, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useAgentStore, SavedWorkspace } from '../store/useAgentStore';
import { FileTree } from './FileTree';

export const WorkspaceItem: React.FC<{ ws: SavedWorkspace }> = ({ ws }) => {
  const { systemContext, toggleFolder, renameWorkspace, openContextMenu, setEditingWorkspaceId } = useAgentStore();
  const isExpanded = systemContext.expandedFolders[ws.id] ?? true;
  const isEditing = systemContext.editingWorkspaceId === ws.id;
  const [editName, setEditName] = useState(ws.name);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    if (editName.trim()) {
      renameWorkspace(ws.id, editName.trim());
    } else {
      setEditName(ws.name); // Revert if empty
    }
    setEditingWorkspaceId(null);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'workspace',
      path: ws.id,
      workspaceId: ws.id,
      name: ws.name
    });
  };

  return (
    <div className="flex flex-col group" onContextMenu={handleRightClick}>
      <div className="flex items-center justify-between mb-1 hover:bg-white/5 rounded px-1 relative">
        <div 
          className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white transition-colors select-none py-1 flex-1 min-w-0"
          onClick={() => !isEditing && toggleFolder(ws.id, !isExpanded)}
        >
          <ChevronRight 
            size={14} 
            className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-white' : 'text-gray-500'}`} 
          />
          <Box size={14} className="text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
          
          {isEditing ? (
            <input 
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setEditName(ws.name);
                  setEditingWorkspaceId(null);
                }
              }}
              className="bg-black/50 border border-primary/50 text-white px-1.5 py-0.5 rounded text-xs w-full outline-none"
            />
          ) : (
            <span className="text-xs font-bold truncate uppercase tracking-wider">{ws.name}</span>
          )}
        </div>
        
        {!isEditing && (
          <div className="relative shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                const rect = e.currentTarget.getBoundingClientRect();
                openContextMenu({
                  x: rect.left,
                  y: rect.bottom + 4,
                  type: 'workspace',
                  path: ws.id,
                  workspaceId: ws.id,
                  name: ws.name
                });
              }}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && ws.folders.length > 0 && (
        <div className="pl-2 border-l border-white/5 ml-1.5 mt-1">
          <FileTree 
            files={ws.folders.map(f => ({
              name: f.split(/[/\\]/).pop() || f,
              isDirectory: true,
              path: f
            }))} 
            parentPath="" 
            workspaceId={ws.id}
            isRootRepo={true}
          />
        </div>
      )}
      
      {isExpanded && ws.folders.length === 0 && (
        <div className="pl-6 text-[10px] text-gray-500 italic py-1">
          No folders added
        </div>
      )}
    </div>
  );
};
