import React, { useState, useEffect } from 'react';
import { FileCode, Folder, Search, Check } from 'lucide-react';
import { useAgentStore, ContextAttachment } from '../../../store/useAgentStore';
import { listWorkspaceFilesAndFolders, packFolderContext, WorkspaceFileItem } from '../../../services/workspace/workspaceFileService';
import { resolveWorkspaceRepoInfo } from '../../../services/workspace/workspaceRepoResolver';

interface ContextFilePickerTabProps {
  onAttach: (attachment: ContextAttachment) => void;
}

export const ContextFilePickerTab: React.FC<ContextFilePickerTabProps> = ({ onAttach }) => {
  const { systemContext, contextAttachments } = useAgentStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'folders'>('all');
  const [files, setFiles] = useState<WorkspaceFileItem[]>([]);
  const [folders, setFolders] = useState<WorkspaceFileItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ws = systemContext.workspaces.find((w) => w.id === systemContext.activeWorkspaceId);
      const res = await listWorkspaceFilesAndFolders(ws?.folders?.[0] || systemContext.cwd);
      setFiles(res.files);
      setFolders(res.folders);
      setLoading(false);
    })();
  }, [systemContext.activeWorkspaceId, systemContext.cwd]);

  const allItems = [
    ...(filterType !== 'files' ? folders.map(f => ({ ...f, isFolder: true })) : []),
    ...(filterType !== 'folders' ? files.map(f => ({ ...f, isFolder: false })) : [])
  ];

  const filteredItems = allItems
    .filter((f) => {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.relativePath.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
    })
    .slice(0, 40);

  const handleSelect = async (item: WorkspaceFileItem & { isFolder: boolean }) => {
    if (item.isFolder) {
      const att = await packFolderContext(item.path, item.name);
      if (att) onAttach(att);
      return;
    }
    const info = resolveWorkspaceRepoInfo(item.path, systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);
    let content = '';
    try {
      // @ts-ignore
      const res = await window.lamApi?.fs?.readFile?.(item.path);
      content = res?.success && typeof res.data === 'string' ? res.data : '';
    } catch {}

    onAttach({
      id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: item.name,
      path: item.path,
      relativePath: item.relativePath,
      rootPath: info.rootPath,
      workspaceRepoTag: info.tag,
      type: 'file',
      tokenEstimate: Math.max(100, Math.ceil((content.length || 500) / 3.8)),
      pinned: true,
      snippet: content.slice(0, 4000)
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files & folders (e.g. services, main.ts...)"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex bg-black/40 rounded-xl border border-white/10 p-0.5 text-[10px]">
          {(['all', 'folders', 'files'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-1 rounded-lg capitalize transition-colors ${filterType === t ? 'bg-primary text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
        {loading ? (
          <div className="p-4 text-center text-xs text-gray-500">Scanning workspace...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No matching items found.</div>
        ) : (
          filteredItems.map((item) => {
            const isAttached = contextAttachments.some((a) => a.path === item.path);
            const info = resolveWorkspaceRepoInfo(item.path, systemContext.workspaces, systemContext.activeWorkspaceId, systemContext.cwd);
            return (
              <button
                key={`${item.isFolder ? 'dir' : 'file'}-${item.path}`}
                disabled={isAttached}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-40 text-left transition-colors border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.isFolder ? <Folder size={13} className="text-amber-400 shrink-0" /> : <FileCode size={13} className="text-cyan-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-white truncate block">{item.name}{item.isFolder ? '/' : ''}</span>
                      <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-500/20 shrink-0">
                        ({info.tag})
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 truncate block font-mono" title={info.rootPath}>{info.rootPath}</span>
                  </div>
                </div>
                {isAttached ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium shrink-0">
                    <Check size={11} /> Attached
                  </span>
                ) : (
                  <span className={`text-[10px] hover:underline font-medium shrink-0 ${item.isFolder ? 'text-amber-300' : 'text-primary'}`}>
                    {item.isFolder ? '+ Folder' : 'Attach'}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
