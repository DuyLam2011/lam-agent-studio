import React, { useState } from 'react';
import { Terminal, Code, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, Copy, Check, GitCommit } from 'lucide-react';
import { ToolCallItem, useAgentStore } from '../../store/useAgentStore';
import clsx from 'clsx';

export const ToolCallCard: React.FC<{ toolCall: ToolCallItem }> = ({ toolCall }) => {
  const { setDiffReviewModalOpen } = useAgentStore();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFileTool = toolCall.name === 'write_file' || toolCall.name === 'edit_file';
  const isNodeRepl = toolCall.name === 'js' || toolCall.name === 'node_repl';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = JSON.stringify(toolCall.result ?? toolCall.args, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getToolIcon = (name: string) => {
    if (name === 'js' || name === 'node_repl') return <Code size={12} className="text-yellow-400" />;
    if (name.includes('terminal') || name.includes('bash') || name.includes('cmd')) {
      return <Terminal size={12} className="text-cyan-400" />;
    }
    return <Code size={12} className="text-purple-400" />;
  };

  return (
    <div className="my-1.5 rounded-lg border border-white/10 bg-black/40 overflow-hidden text-xs">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          {getToolIcon(toolCall.name)}
          <span className="font-mono text-[11px] font-semibold text-gray-200 truncate">{toolCall.name}</span>
          {isNodeRepl && (
            <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.2 rounded font-mono shrink-0">
              node_repl
            </span>
          )}
          {toolCall.autoApproved && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono shrink-0">
              ⚡ Auto-approved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toolCall.status === 'running' && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
              <Loader2 size={11} className="animate-spin" /> Running
            </span>
          )}
          {toolCall.status === 'success' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <CheckCircle2 size={11} /> Done
            </span>
          )}
          {toolCall.status === 'failed' && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
              <XCircle size={11} /> Failed
            </span>
          )}

          {toolCall.executionTimeMs !== undefined && (
            <span className="text-[9px] text-gray-500 font-mono">{toolCall.executionTimeMs}ms</span>
          )}

          {isFileTool && toolCall.status === 'success' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDiffReviewModalOpen(true);
              }}
              className="px-2 py-0.5 rounded-md text-[9px] bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-mono flex items-center gap-1 transition-colors border border-purple-500/30 shrink-0"
              title="Review file changes and diff"
            >
              <GitCommit size={10} /> Review Diff
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
            title="Copy tool payload"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>

          {expanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-black/60 p-2.5 space-y-2 text-[11px] font-mono">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1 flex items-center justify-between">
              <span>Arguments</span>
              {isNodeRepl && <span className="text-[9px] text-yellow-400/80 lowercase">node_repl engine</span>}
            </div>
            <pre className="p-1.5 rounded bg-white/5 text-gray-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-36 font-mono text-[10.5px]">
              {isNodeRepl && toolCall.args?.code ? toolCall.args.code : JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {toolCall.result && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Result</div>
              <pre className={clsx(
                "p-1.5 rounded overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-40",
                toolCall.status === 'failed' ? "bg-rose-950/30 text-rose-300 border border-rose-500/20" : "bg-white/5 text-emerald-200"
              )}>
                {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
