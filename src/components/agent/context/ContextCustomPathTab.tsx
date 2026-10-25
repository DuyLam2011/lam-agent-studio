import React, { useState } from 'react';
import { Terminal, FilePlus } from 'lucide-react';
import { useAgentStore, ContextAttachment } from '../../../store/useAgentStore';

interface ContextCustomPathTabProps {
  onAttach: (attachment: ContextAttachment) => void;
}

export const ContextCustomPathTab: React.FC<ContextCustomPathTabProps> = ({ onAttach }) => {
  const { addToast } = useAgentStore();
  const [customPath, setCustomPath] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAttachPath = async () => {
    if (!customPath.trim()) {
      addToast('Please enter a file or folder path', 'error');
      return;
    }
    setLoading(true);
    const cleaned = customPath.trim();
    const name = cleaned.split(/[/\\]/).pop() || cleaned;

    try {
      // @ts-ignore
      const res = await window.lamApi?.file?.read?.(cleaned);
      const content = res?.content || res || '';
      const tokenEstimate = Math.max(100, Math.ceil((content.length || 400) / 3.8));

      onAttach({
        id: `ctx-path-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name,
        path: cleaned,
        type: 'file',
        tokenEstimate,
        pinned: true,
        snippet: content ? content.slice(0, 4000) : undefined
      });
      setCustomPath('');
    } catch {
      onAttach({
        id: `ctx-path-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name,
        path: cleaned,
        type: 'file',
        tokenEstimate: 200,
        pinned: true
      });
      setCustomPath('');
    } finally {
      setLoading(false);
    }
  };

  const samplePaths = ['package.json', 'src/App.tsx', 'electron/main.ts', 'tsconfig.json'];

  return (
    <div className="space-y-3 text-xs">
      <div>
        <label className="text-[10px] text-gray-400 block mb-1">Custom File or Directory Path</label>
        <div className="relative">
          <Terminal size={12} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="e.g. src/store/useAgentStore.ts or relative/path/to/file"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-gray-500 block">Quick Workspace Presets:</span>
        <div className="flex flex-wrap gap-1.5">
          {samplePaths.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setCustomPath(p)}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-300 border border-white/5 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!customPath.trim() || loading}
        onClick={handleAttachPath}
        className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-semibold text-xs transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
      >
        <FilePlus size={13} />
        <span>{loading ? 'Validating...' : 'Attach Custom Path to Context'}</span>
      </button>
    </div>
  );
};
