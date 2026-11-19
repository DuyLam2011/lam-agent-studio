import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, ExternalLink, RefreshCw, HardDrive } from 'lucide-react';
import { MemoryFolderTreeNode } from '../../../types/memory';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

export const MemoryFolderTreeView: React.FC = () => {
  const { systemContext, addToast } = useAgentStore();
  const [treeData, setTreeData] = useState<MemoryFolderTreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ decisions: true, conventions: true, graph: true });

  const activeWsPath = systemContext.workspaces[0]?.folders[0] || '';

  const loadTree = async () => {
    setLoading(true);
    try {
      const data = await window.lamApi?.storage?.getMemoryFolderTree?.(activeWsPath);
      if (data) setTreeData(data);
    } catch (err: any) {
      addToast(`Failed to load memory folder tree: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTree(); }, [activeWsPath]);

  const toggleFolder = (pathKey: string) => {
    setExpanded((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  const handleOpenFile = async (relPath: string) => {
    try {
      const ok = await window.lamApi?.storage?.openMemoryFile?.(activeWsPath, relPath);
      if (ok) addToast(`Opened ${relPath} in editor`, 'success');
      else addToast(`Could not open file: ${relPath}`, 'info');
    } catch {
      addToast(`Error opening file ${relPath}`, 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black/20 p-4 rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <HardDrive size={15} className="text-primary" />
          <span className="text-xs font-semibold text-gray-200">Disk Storage Layout</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono">
            {activeWsPath ? `${activeWsPath}/.agents/memory/` : '~/.lam/memory/'}
          </span>
        </div>
        <button onClick={loadTree} disabled={loading} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" title="Refresh Tree">
          <RefreshCw size={12} className={clsx(loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-1 font-mono text-xs">
        {treeData?.children?.map((folder) => {
          const isExp = expanded[folder.name] ?? false;
          return (
            <div key={folder.name} className="space-y-1">
              <div
                onClick={() => toggleFolder(folder.name)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-gray-300 select-none group"
              >
                <div className="flex items-center gap-2">
                  {isExp ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronRight size={13} className="text-gray-500" />}
                  <Folder size={13} className="text-amber-400/80" />
                  <span className="font-semibold text-gray-200">{folder.name}/</span>
                  <span className="text-[10px] text-gray-500">({folder.children?.length || 0} files)</span>
                </div>
              </div>

              {isExp && (
                <div className="pl-6 space-y-0.5 border-l border-white/5 ml-3">
                  {(!folder.children || folder.children.length === 0) ? (
                    <div className="text-[10px] text-gray-500 py-1 pl-2 italic">empty directory</div>
                  ) : (
                    folder.children.map((file) => (
                      <div
                        key={file.relativePath}
                        className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-white/5 text-gray-400 hover:text-gray-200 group transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={12} className="text-cyan-400/80 shrink-0" />
                          <span className="truncate text-[11px]">{file.name}</span>
                          {file.size ? <span className="text-[9px] text-gray-600">({Math.round(file.size / 1024 * 10) / 10} KB)</span> : null}
                        </div>
                        <button
                          onClick={() => handleOpenFile(file.relativePath)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-300 hover:text-white transition-opacity"
                          title="Open file in editor"
                        >
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
