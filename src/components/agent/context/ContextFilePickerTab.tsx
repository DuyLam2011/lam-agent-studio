import React, { useState, useEffect } from 'react';
import { FileCode, Search, Check } from 'lucide-react';
import { useAgentStore, ContextAttachment } from '../../../store/useAgentStore';

interface ContextFilePickerTabProps {
  onAttach: (attachment: ContextAttachment) => void;
}

export const ContextFilePickerTab: React.FC<ContextFilePickerTabProps> = ({ onAttach }) => {
  const { systemContext, contextAttachments, activeFile } = useAgentStore();
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWorkspaceFiles = async () => {
      setLoading(true);
      const ws = systemContext.workspaces.find(w => w.id === systemContext.activeWorkspaceId);
      const rootPath = ws?.folders?.[0] || systemContext.cwd;
      try {
        // @ts-ignore
        const res = await window.lamApi?.file?.search?.(rootPath, '', 100);
        if (res?.success && Array.isArray(res.files)) {
          setFiles(res.files.map((f: any) => typeof f === 'string' ? f : f.path || f.name));
        } else if (activeFile?.path) {
          setFiles([activeFile.path]);
        }
      } catch {
        if (activeFile?.path) setFiles([activeFile.path]);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaceFiles();
  }, [systemContext.activeWorkspaceId, activeFile?.path]);

  const filteredFiles = files.filter(f => f.toLowerCase().includes(search.toLowerCase())).slice(0, 40);

  const handleSelect = async (filePath: string) => {
    const name = filePath.split(/[/\\]/).pop() || filePath;
    let content = '';
    try {
      // @ts-ignore
      const res = await window.lamApi?.file?.read?.(filePath);
      content = res?.content || res || '';
    } catch {}

    const tokenEstimate = Math.max(100, Math.ceil((content.length || 500) / 3.8));
    onAttach({
      id: `ctx-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      path: filePath,
      type: 'file',
      tokenEstimate,
      pinned: true,
      snippet: content.slice(0, 4000)
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workspace files (e.g. main.ts, useAgentStore...)"
          className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
        {loading ? (
          <div className="p-4 text-center text-xs text-gray-500">Scanning workspace files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No matching files found.</div>
        ) : (
          filteredFiles.map((filePath) => {
            const isAttached = contextAttachments.some(a => a.path === filePath && a.type === 'file');
            const name = filePath.split(/[/\\]/).pop() || filePath;
            return (
              <button
                key={filePath}
                disabled={isAttached}
                onClick={() => handleSelect(filePath)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-40 text-left transition-colors border border-transparent hover:border-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode size={13} className="text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white truncate block">{name}</span>
                    <span className="text-[10px] text-gray-500 truncate block font-mono">{filePath}</span>
                  </div>
                </div>
                {isAttached ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <Check size={11} /> Attached
                  </span>
                ) : (
                  <span className="text-[10px] text-primary hover:underline font-medium">Attach</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
