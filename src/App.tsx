import React, { useEffect, useState } from 'react';
import { useAgentStore } from './store/useAgentStore';
import { Terminal, Folder, FolderOpen, Settings, Plus, Search, GitBranch } from 'lucide-react';
import clsx from 'clsx';
import TitleBar from './components/TitleBar';
import { FileTree } from './components/FileTree';
import { WorkspaceItem } from './components/WorkspaceItem';
import { GlobalContextMenu } from './components/GlobalContextMenu';
import { SearchPanel } from './components/SearchPanel';
import { GitPanel } from './components/GitPanel';
import FileEditor from './components/Editor';
import AgentConfigPanel from './components/AgentConfigPanel';
import AccountCenterModal from './components/AccountCenterModal';
import CloneRepositoryModal from './components/CloneRepositoryModal';
import { ToastContainer } from './components/ToastContainer';

function App() {
  const { wsStatus, setWsStatus, systemContext, activeSidebarTab, setActiveSidebarTab } = useAgentStore();
  const [leftWidth, setLeftWidth] = useState(256);
  const [rightWidth, setRightWidth] = useState(320);

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setLeftWidth(Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX))));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      setRightWidth(Math.max(250, Math.min(800, startWidth - (moveEvent.clientX - startX))));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    // Listen for WebSocket status updates via IPC
    // @ts-ignore
    if (window.lamApi) {
      // @ts-ignore
      window.lamApi.onWebSocketStatus?.((status: string) => {
        setWsStatus(status);
      });

      // Load initial settings
      // @ts-ignore
      window.lamApi.settingsAPI?.loadSettings().then((settings: any) => {
        useAgentStore.getState().loadSettings(settings);
      });
    }
  }, [setWsStatus]);

  const handleNewWorkspace = () => {
    useAgentStore.getState().createWorkspace("Untitled Workspace");
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-foreground overflow-hidden font-sans selection:bg-primary selection:text-white">
      <TitleBar />
      <GlobalContextMenu />
      <AccountCenterModal />
      <CloneRepositoryModal />
      <ToastContainer />

      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar - Explorer */}
        <aside style={{ width: leftWidth }} className="flex flex-col z-10 my-4 ml-4 mr-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden shrink-0">

          <div className="p-4 flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="flex items-center justify-between mb-3 group/header shrink-0">
              <h2 className="text-xs uppercase text-gray-500 font-semibold flex items-center gap-2">
                {activeSidebarTab === 'explorer' && <><Folder size={14} /> Explorer</>}
                {activeSidebarTab === 'search' && <><Search size={14} /> Agent track down</>}
                {activeSidebarTab === 'git' && <><GitBranch size={14} /> Source Control</>}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveSidebarTab('explorer')}
                  className={clsx("p-1 rounded hover:bg-white/10 transition-colors", activeSidebarTab === 'explorer' ? "text-primary" : "text-gray-400 hover:text-white")}
                  title="Explorer"
                >
                  <FolderOpen size={14} />
                </button>
                <button
                  onClick={() => setActiveSidebarTab('search')}
                  className={clsx("p-1 rounded hover:bg-white/10 transition-colors", activeSidebarTab === 'search' ? "text-primary" : "text-gray-400 hover:text-white")}
                  title="Search"
                >
                  <Search size={14} />
                </button>
                <button
                  onClick={() => setActiveSidebarTab('git')}
                  className={clsx("p-1 rounded hover:bg-white/10 transition-colors", activeSidebarTab === 'git' ? "text-primary" : "text-gray-400 hover:text-white")}
                  title="Source Control"
                >
                  <GitBranch size={14} />
                </button>
                <button
                  onClick={() => { setActiveSidebarTab('explorer'); handleNewWorkspace(); }}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors ml-1"
                  title="New Workspace"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {activeSidebarTab === 'explorer' && (
              <div className="overflow-y-auto flex-1 custom-scrollbar pt-2 space-y-2">
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
        </aside>

        {/* Drag Handle Left */}
        <div
          onMouseDown={startResizeLeft}
          className="w-2 my-4 z-20 shrink-0 cursor-col-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full"
        >
          <div className="w-1 h-8 bg-white/20 rounded-full group-hover:bg-white/80 transition-colors" />
        </div>

        {/* Center Main Panel - Editor */}
        <main className="flex-1 flex flex-col relative my-4 mx-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden min-w-0">
          {/* Dynamic decorative background elements */}
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <FileEditor />
        </main>

        {/* Drag Handle Right */}
        <div
          onMouseDown={startResizeRight}
          className="w-2 my-4 z-20 shrink-0 cursor-col-resize hover:bg-white/10 flex items-center justify-center transition-colors group rounded-full"
        >
          <div className="w-1 h-8 bg-white/20 rounded-full group-hover:bg-white/80 transition-colors" />
        </div>

        {/* Right Sidebar - Agent Config */}
        <AgentConfigPanel width={rightWidth} />

      </div>
    </div>
  );
}

export default App;
