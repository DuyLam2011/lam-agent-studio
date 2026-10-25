import React, { useState } from 'react';
import { X, Layers, FileCode, MousePointerClick, Terminal } from 'lucide-react';
import { useAgentStore, ContextAttachment } from '../../../store/useAgentStore';
import { ContextFilePickerTab } from './ContextFilePickerTab';
import { ContextLineRangeTab } from './ContextLineRangeTab';
import { ContextCustomPathTab } from './ContextCustomPathTab';
import clsx from 'clsx';

export const AddContextModal: React.FC = () => {
  const { isAddContextModalOpen, setAddContextModalOpen, addContextAttachment, addToast } = useAgentStore();
  const [tab, setTab] = useState<'files' | 'lines' | 'path'>('files');

  if (!isAddContextModalOpen) return null;

  const handleAttach = (attachment: ContextAttachment) => {
    addContextAttachment(attachment);
    addToast(`Attached ${attachment.name} to AI Context`, 'success');
    setAddContextModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Layers size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">Add Context to AI Prompt</h3>
              <p className="text-[10px] text-gray-400">Target specific workspace files, line ranges, or paths</p>
            </div>
          </div>
          <button
            onClick={() => setAddContextModalOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-2.5 border-b border-white/5 gap-2 bg-black/20">
          <button
            onClick={() => setTab('files')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2",
              tab === 'files' ? "border-primary text-primary font-semibold bg-white/5" : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <FileCode size={12} />
            <span>Browse Files</span>
          </button>
          <button
            onClick={() => setTab('lines')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2",
              tab === 'lines' ? "border-purple-400 text-purple-300 font-semibold bg-white/5" : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <MousePointerClick size={12} />
            <span>Line Range / Selection</span>
          </button>
          <button
            onClick={() => setTab('path')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2",
              tab === 'path' ? "border-cyan-400 text-cyan-300 font-semibold bg-white/5" : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <Terminal size={12} />
            <span>Custom Path</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4">
          {tab === 'files' && <ContextFilePickerTab onAttach={handleAttach} />}
          {tab === 'lines' && <ContextLineRangeTab onAttach={handleAttach} />}
          {tab === 'path' && <ContextCustomPathTab onAttach={handleAttach} />}
        </div>
      </div>
    </div>
  );
};
