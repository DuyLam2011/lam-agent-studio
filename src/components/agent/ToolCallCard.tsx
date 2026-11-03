import React, { useState } from 'react';
import { Terminal, Code, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, Copy, Check, GitBranch, Code2 } from 'lucide-react';
import { ToolCallItem } from '../../store/useAgentStore';
import { ToolCallDiffActions } from './tool-call/ToolCallDiffActions';
import { openFileInEditor } from '../../services/workspace/workspaceFileService';
import clsx from 'clsx';

export const ToolCallCard: React.FC<{ toolCall: ToolCallItem }> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isNodeRepl = toolCall.name === 'js' || toolCall.name === 'node_repl';

  const getHeadline = () => {
    const args = toolCall.args || {};
    const targetFile = (args.filePath || args.path || '').split(/[/\\]/).pop();
    if (toolCall.name === 'read_file') {
      const lines = args.startLine ? ` (L${args.startLine}-${args.endLine})` : '';
      return { action: 'Read File', target: `${targetFile || 'file'}${lines}` };
    }
    if (toolCall.name === 'write_file') return { action: 'Write File', target: targetFile || 'file' };
    if (toolCall.name === 'edit_file' || toolCall.name === 'patch_file') return { action: 'Patch File', target: targetFile || 'file' };
    if (toolCall.name === 'run_command') return { action: 'Command', target: args.command || 'bash' };
    if (toolCall.name === 'js' || toolCall.name === 'node_repl') return { action: 'Node REPL', target: 'In-Memory Script' };
    if (toolCall.name === 'git_status') return { action: 'Git Status', target: 'Working Tree' };
    if (toolCall.name === 'git_diff') return { action: 'Git Diff', target: targetFile || (args.staged ? 'Staged' : 'Working Tree') };
    if (toolCall.name === 'list_directory' || toolCall.name === 'list_workspace') return { action: 'List Dir', target: targetFile || 'root' };
    return { action: 'Tool', target: toolCall.name };
  };

  const headline = getHeadline();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = JSON.stringify(toolCall.result ?? toolCall.args, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getToolIcon = (name: string) => {
    if (name === 'git_diff' || name === 'git_status') return <GitBranch size={12} className="text-gray-400 shrink-0" />;
    if (name === 'js' || name === 'node_repl') return <Code size={12} className="text-gray-400 shrink-0" />;
    if (name.includes('terminal') || name.includes('bash') || name.includes('cmd') || name === 'run_command') {
      return <Terminal size={12} className="text-gray-400 shrink-0" />;
    }
    return <Code size={12} className="text-gray-400 shrink-0" />;
  };

  return (
    <div className="my-1.5 rounded-lg border border-white/10 surface-card overflow-hidden text-xs">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors gap-2"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {getToolIcon(toolCall.name)}
          <span className="font-semibold text-gray-200 shrink-0">{headline.action}:</span>
          <span className="font-mono text-gray-300 truncate" title={headline.target}>{headline.target}</span>
          {isNodeRepl && (
            <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1 py-0.2 rounded font-mono shrink-0">
              node_repl
            </span>
          )}
          {toolCall.autoApproved && (
            <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1 py-0.2 rounded font-mono shrink-0">
              auto
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toolCall.status === 'running' && (
            <span className="flex items-center gap-1 text-[10px] text-gray-200 font-mono">
              <Loader2 size={11} className="animate-spin text-primary" /> Running
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

          <ToolCallDiffActions toolCall={toolCall} />

          {(toolCall.args?.filePath || toolCall.args?.path) && !toolCall.name.includes('directory') && !toolCall.name.includes('workspace') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openFileInEditor(toolCall.args?.filePath || toolCall.args?.path, undefined, toolCall.args?.startLine);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors shrink-0"
              title="Open in Editor"
            >
              <Code2 size={10} />
              <span>Editor</span>
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
        <div className="border-t border-white/5 bg-black/40 p-2.5 space-y-2 text-[11px] font-mono">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Arguments</div>
            <pre className="p-1.5 rounded bg-white/5 text-gray-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-36 font-mono text-[10.5px]">
              {isNodeRepl && toolCall.args?.code ? toolCall.args.code : JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {toolCall.result && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Result</div>
              <pre className={clsx(
                "p-1.5 rounded overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-40",
                toolCall.status === 'failed' ? "bg-rose-950/20 text-rose-300 border border-rose-500/20" : "bg-white/5 text-gray-200"
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
