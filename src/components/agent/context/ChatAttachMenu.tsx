import React, { useState, useRef, useEffect } from 'react';
import { Plus, FileCode, GitCommit, FolderPlus, Scissors, ChevronUp } from 'lucide-react';
import { useChatAttachActions } from './useChatAttachActions';
import clsx from 'clsx';

export const ChatAttachMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    activeFile,
    editorSelection,
    handleAddActiveFile,
    handleAddGitDiff,
    handleAddSelection,
    openBrowseModal
  } = useChatAttachActions();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const onAttach = (fn: () => boolean) => {
    if (fn()) setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-medium border transition-all select-none",
          isOpen
            ? "bg-primary text-white border-primary shadow-sm"
            : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
        )}
        title="Attach context (Files, Folders, Git Diff)"
      >
        <Plus size={11} className={isOpen ? "text-white" : "text-primary"} />
        <span>Context</span>
        <ChevronUp size={10} className={clsx("transition-transform", !isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="surface-dropdown absolute bottom-full left-0 mb-1.5 w-56 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-app-muted font-semibold border-b border-border/50">
            Attach to Context
          </div>

          <button
            type="button"
            onClick={() => onAttach(handleAddActiveFile)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 text-left text-gray-200 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileCode size={12} className="text-cyan-400 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-medium">Active File</div>
                <div className="text-[9.5px] text-app-muted truncate">{activeFile?.name || 'No file active'}</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onAttach(handleAddGitDiff)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-left text-gray-200 transition-colors"
          >
            <GitCommit size={12} className="text-amber-400 shrink-0" />
            <div className="truncate">
              <div className="text-[11px] font-medium">Git Diff</div>
              <div className="text-[9.5px] text-app-muted">Uncommitted workspace changes</div>
            </div>
          </button>

          {editorSelection?.text && (
            <button
              type="button"
              onClick={() => onAttach(handleAddSelection)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-left text-gray-200 transition-colors"
            >
              <Scissors size={12} className="text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-medium">Code Selection</div>
                <div className="text-[9.5px] text-app-muted">Lines {editorSelection.startLine}-{editorSelection.endLine}</div>
              </div>
            </button>
          )}

          <div className="border-t border-border/40 my-1" />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              openBrowseModal();
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/20 text-left text-primary transition-colors font-medium text-[11px]"
          >
            <FolderPlus size={12} className="shrink-0" />
            <span>Browse Files & Folders...</span>
          </button>
        </div>
      )}
    </div>
  );
};
