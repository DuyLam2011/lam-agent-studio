import React from 'react';
import { useAgentStore } from '../../store/useAgentStore';
import { Folder, FolderOpen, Plus, Search, GitBranch } from 'lucide-react';
import clsx from 'clsx';
import { WorkspaceItem } from './WorkspaceItem';
import { SearchPanel } from '../search/SearchPanel';
import { GitPanel } from '../git/GitPanel';
import { DynamicPanelHeader } from '../layout/DynamicPanelHeader';

export const ExplorerPanel: React.FC<{ isCenter?: boolean }> = ({ isCenter = false }) => {
  const { systemContext, activeSidebarTab, setActiveSidebarTab, createWorkspace } = useAgentStore();

  return (
    <div className={clsx("flex flex-col h-full overflow-hidden", isCenter && "w-full")}>
      <DynamicPanelHeader panelId="explorer">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSidebarTab('explorer')}
            className={clsx("p-1 rounded hover:bg-white/10 transition-colors", activeSidebarTab === 'explorer' ? "text-primary" : "text-gray-400 hover:text-white")}
            title="Explorer"
          >
            <FolderOpen size={12} />
          </button>
          <button
            onClick={() => setActiveSidebarTab('search')}
            className={clsx("p-1 rounded hover:bg-white/10 transition-colors", activeSidebarTab === 'search' ? "text-primary" : "text-gray-400 hover:text-white")}
            title="Search"
          >
            <Search size={12} />
          </button>
          <button
            onClick={() => setActiveSidebarTab('git')}
            className={clsx("p-1 rounded hover:bg-white/10 transition-colors", activeSidebarTab === 'git' ? "text-primary" : "text-gray-400 hover:text-white")}
            title="Source Control"
          >
            <GitBranch size={12} />
          </button>
          <button
            onClick={() => createWorkspace("Untitled Workspace")}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="New Workspace"
          >
            <Plus size={12} />
          </button>
        </div>
      </DynamicPanelHeader>

      <div className="p-3 flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h2 className="text-[10px] uppercase text-gray-500 font-bold tracking-wider flex items-center gap-1.5">
            {activeSidebarTab === 'explorer' && <><Folder size={12} /> Workspaces</>}
            {activeSidebarTab === 'search' && <><Search size={12} /> Semantic Search</>}
            {activeSidebarTab === 'git' && <><GitBranch size={12} /> Version Control</>}
          </h2>
        </div>

        {activeSidebarTab === 'explorer' && (
          <div className="overflow-y-auto flex-1 custom-scrollbar pt-1 space-y-2">
            {systemContext.workspaces.length > 0 ? (
              systemContext.workspaces.map(ws => (
                <WorkspaceItem key={ws.id} ws={ws} />
              ))
            ) : (
              <div className="text-xs text-gray-500 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl h-24 mt-2">
                <span className="italic">No workspaces found</span>
              </div>
            )}
          </div>
        )}

        {activeSidebarTab === 'search' && <SearchPanel />}
        {activeSidebarTab === 'git' && <GitPanel />}
      </div>
    </div>
  );
};
