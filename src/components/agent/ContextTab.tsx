import React from 'react';
import { Layers, FileCode, Trash2, Plus, Sparkles, BookOpen } from 'lucide-react';
import { useAgentStore, ContextAttachment, ContextPruningStrategy } from '../../store/useAgentStore';
import { ContextItemRow } from './ContextItemRow';
import clsx from 'clsx';

const ContextTab: React.FC = () => {
  const {
    contextAttachments,
    removeContextAttachment,
    clearContextAttachments,
    togglePinAttachment,
    engineSettings,
    updateEngineSettings,
    activeFile,
    addContextAttachment,
    addToast,
  } = useAgentStore();

  const handleAddActiveFile = () => {
    if (!activeFile?.path) {
      addToast('No open file in editor to pin', 'info');
      return;
    }
    const attachment: ContextAttachment = {
      id: Math.random().toString(36).substring(7),
      name: activeFile.name || activeFile.path.split(/[/\\]/).pop() || 'file',
      path: activeFile.path,
      type: 'file',
      tokenEstimate: Math.max(120, Math.ceil((activeFile.content?.length || 0) / 3.8)),
      pinned: true,
    };
    addContextAttachment(attachment);
    addToast(`Pinned ${attachment.name} into context`, 'success');
  };

  const pruningOptions: { id: ContextPruningStrategy; label: string; desc: string }[] = [
    { id: 'auto-sliding', label: 'Sliding Window', desc: 'Preserves pinned files & recent 12 turns' },
    { id: 'caveman', label: 'Caveman Mode', desc: 'Compresses tokens ~75% preserving code facts' },
    { id: 'summarize', label: 'Summarizer', desc: 'Summarizes background history at 80% tokens' },
  ];

  return (
    <div className="p-3 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar h-full">
      {/* Context Strategy Selector */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
          <Sparkles size={11} className="text-primary" /> Compression Strategy
        </span>
        <div className="space-y-1">
          {pruningOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                updateEngineSettings({ pruningStrategy: opt.id });
                addToast(`Strategy: ${opt.label}`, 'info');
              }}
              className={clsx(
                "w-full p-2 rounded-lg text-left transition-all border",
                engineSettings.pruningStrategy === opt.id
                  ? "bg-primary/15 border-primary/40 text-white"
                  : "bg-white/5 border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              <div className="text-xs font-semibold">{opt.label}</div>
              <div className="text-[10px] text-gray-500 leading-tight">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pinned & Attached Files */}
      <div className="flex-1 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
            <Layers size={11} className="text-cyan-400" /> Active Payloads ({contextAttachments.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAddActiveFile}
              className="p-1 px-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] flex items-center gap-1 border border-white/10"
              title="Pin Active Editor File"
            >
              <Plus size={11} /> Pin Current
            </button>
            {contextAttachments.length > 0 && (
              <button
                onClick={clearContextAttachments}
                className="p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 text-[10px]"
                title="Clear all attachments"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {contextAttachments.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center text-gray-500 space-y-1.5">
            <FileCode size={20} className="text-gray-600" />
            <p className="text-xs text-gray-400">No custom files pinned</p>
            <p className="text-[10px] text-gray-600">Files added to context will be prioritized by the model.</p>
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto custom-scrollbar max-h-48">
            {contextAttachments.map((item) => (
              <ContextItemRow
                key={item.id}
                item={item}
                onTogglePin={togglePinAttachment}
                onRemove={removeContextAttachment}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workspace Rules Injection Card */}
      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
          <BookOpen size={11} className="text-yellow-400" /> Rule Context Status
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span className="font-mono text-gray-200 text-[11px]">GEMINI.md</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
            Active in Prompt
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContextTab;
