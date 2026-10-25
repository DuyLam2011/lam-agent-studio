import React, { useState } from 'react';
import { X, Undo2, CheckCircle2, FileCode, ExternalLink } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { DiffViewerBody } from './DiffViewerBody';
import { AgentAvatar } from '../avatar/AgentAvatar';
import clsx from 'clsx';

export const AgentDiffReviewModal: React.FC = () => {
  const {
    isDiffReviewModalOpen,
    setDiffReviewModalOpen,
    pendingAgentDiffs,
    revertAgentDiff,
    clearAgentDiffSnapshots,
    setActiveFile,
    setPanelVisible
  } = useAgentStore();

  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isDiffReviewModalOpen) return null;

  const currentDiff = pendingAgentDiffs[selectedIndex] || pendingAgentDiffs[0];

  const handleOpenInEditor = (diff: any) => {
    setActiveFile({
      name: diff.relativePath,
      path: diff.filePath,
      content: diff.newContent,
      originalContent: diff.originalContent,
      isDiff: true
    });
    setPanelVisible('editor', true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-neutral-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <AgentAvatar role="subagent-qa-reviewer" size="lg" showStatusDot={true} showTooltip={true} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Review Agent Code Changes</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  QA REVIEW SPECIALIST
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {pendingAgentDiffs.length} {pendingAgentDiffs.length === 1 ? 'file' : 'files'} modified by autonomous coding agent
              </p>
            </div>
          </div>
          <button
            onClick={() => setDiffReviewModalOpen(false)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          {/* File Selector Sidebar */}
          <div className="w-64 flex flex-col rounded-2xl bg-black/40 border border-white/5 p-2 space-y-1 overflow-y-auto custom-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
              Modified Files ({pendingAgentDiffs.length})
            </span>
            {pendingAgentDiffs.map((d, idx) => (
              <button
                key={d.id}
                onClick={() => setSelectedIndex(idx)}
                className={clsx(
                  "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border",
                  idx === selectedIndex
                    ? "bg-purple-500/20 border-purple-500/40 text-white font-semibold"
                    : "bg-white/[0.02] border-transparent text-gray-300 hover:bg-white/[0.06]"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode size={12} className={idx === selectedIndex ? "text-purple-300" : "text-gray-400"} />
                  <span className="text-xs truncate font-mono">{d.relativePath}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono text-emerald-400 bg-emerald-500/10">
                  +{d.linesAdded}
                </span>
              </button>
            ))}
          </div>

          {/* Diff Viewer Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {currentDiff ? (
              <DiffViewerBody diff={currentDiff} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
                No active file diff selected.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentDiff && (
              <>
                <button
                  onClick={() => revertAgentDiff(currentDiff.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
                  title="Undo changes to this specific file"
                >
                  <Undo2 size={13} /> Revert This File
                </button>
                <button
                  onClick={() => handleOpenInEditor(currentDiff)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-medium transition-colors"
                >
                  <ExternalLink size={13} /> Open in Studio Editor
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clearAgentDiffSnapshots();
                setDiffReviewModalOpen(false);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 size={14} /> Accept All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
