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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 surface-scrim animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl surface-modal border border-subtle shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle surface-header">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary border border-primary/25 flex items-center justify-center">
              <Layers size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-app-text tracking-wide">Add Context to AI Prompt</h3>
              <p className="text-[10px] text-app-muted">Target specific workspace files, line ranges, or paths</p>
            </div>
          </div>
          <button
            onClick={() => setAddContextModalOpen(false)}
            className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-2.5 border-b border-subtle gap-2 surface-input">
          <button
            onClick={() => setTab('files')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 cursor-pointer",
              tab === 'files' ? "border-primary text-primary font-semibold bg-primary/10" : "border-transparent text-app-muted hover:text-app-text"
            )}
          >
            <FileCode size={12} />
            <span>Browse Files</span>
          </button>
          <button
            onClick={() => setTab('lines')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 cursor-pointer",
              tab === 'lines' ? "border-primary text-primary font-semibold bg-primary/10" : "border-transparent text-app-muted hover:text-app-text"
            )}
          >
            <MousePointerClick size={12} />
            <span>Line Range / Selection</span>
          </button>
          <button
            onClick={() => setTab('path')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border-b-2 cursor-pointer",
              tab === 'path' ? "border-primary text-primary font-semibold bg-primary/10" : "border-transparent text-app-muted hover:text-app-text"
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
