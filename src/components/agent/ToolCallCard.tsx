import React, { useState } from 'react';
import { Terminal, Code, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, Copy, Check, GitBranch, Code2, Bot } from 'lucide-react';
import { ToolCallItem } from '../../store/useAgentStore';
import { ToolCallDiffActions } from './tool-call/ToolCallDiffActions';
import { resolveToolHeadline, cleanShellCmd } from './tool-call/toolCallHeadline';
import { openFileInEditor } from '../../services/workspace/workspaceFileService';
import clsx from 'clsx';

export const ToolCallCard: React.FC<{ toolCall: ToolCallItem; stepNumber?: number }> = ({ toolCall, stepNumber }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isNodeRepl = toolCall.name === 'js' || toolCall.name === 'node_repl';
  const headline = resolveToolHeadline(toolCall.name, toolCall.args);
  const rawCmd = toolCall.args?.CommandLine || toolCall.args?.commandLine || toolCall.args?.command || toolCall.args?.cmd || toolCall.args?.script;
  const cmd = rawCmd ? cleanShellCmd(rawCmd) : '';
  const targetFilePath = toolCall.args?.filePath || toolCall.args?.path || toolCall.args?.Path || toolCall.args?.FilePath || toolCall.args?.filename;
  const hasCustomArgs = toolCall.args && Object.keys(toolCall.args).length > 0 && !cmd;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = cmd || JSON.stringify(toolCall.result ?? toolCall.args, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getToolIcon = (name: string) => {
    if (name === 'git_diff' || name === 'git_status') return <GitBranch size={12} className="text-gray-400 shrink-0" />;
    if (name === 'delegate_to_subagent') return <Bot size={12} className="text-purple-400 shrink-0" />;
    if (name === 'js' || name === 'node_repl') return <Code size={12} className="text-gray-400 shrink-0" />;
    if (name.includes('terminal') || name.includes('bash') || name.includes('cmd') || name.includes('command')) {
      return <Terminal size={12} className="text-cyan-400 shrink-0" />;
    }
    return <Code size={12} className="text-gray-400 shrink-0" />;
  };

  return (
    <div className="my-1.5 rounded-lg border border-white/10 surface-card overflow-hidden text-xs">
      <div onClick={() => setExpanded(!expanded)} className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {stepNumber !== undefined && (
            <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold shrink-0">
              #{stepNumber}
            </span>
          )}
          {getToolIcon(toolCall.name)}
          <span className="font-semibold text-gray-200 shrink-0">{headline.action}:</span>
          <span className="font-mono text-gray-300 truncate" title={headline.target}>{headline.target}</span>
          {isNodeRepl && <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1 py-0.2 rounded font-mono shrink-0">node_repl</span>}
          {toolCall.autoApproved && <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1 py-0.2 rounded font-mono shrink-0">auto</span>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toolCall.status === 'running' && (
            <span className="flex items-center gap-1 text-[10px] text-gray-200 font-mono"><Loader2 size={11} className="animate-spin text-primary" /> Running</span>
          )}
          {toolCall.status === 'success' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono"><CheckCircle2 size={11} /> Done</span>
          )}
          {toolCall.status === 'failed' && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono"><XCircle size={11} /> Failed</span>
          )}
          {toolCall.executionTimeMs !== undefined && <span className="text-[9px] text-gray-500 font-mono">{toolCall.executionTimeMs}ms</span>}
          <ToolCallDiffActions toolCall={toolCall} />

          {targetFilePath && !toolCall.name.includes('directory') && !toolCall.name.includes('list') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openFileInEditor(targetFilePath, undefined, toolCall.args?.startLine || toolCall.args?.StartLine);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors shrink-0"
              title="Open in Editor"
            >
              <Code2 size={10} /><span>Editor</span>
            </button>
          )}

          <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors" title="Copy tool payload">
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
          {expanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 bg-black/40 p-2.5 space-y-2 text-[11px] font-mono">
          {cmd ? (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Command Execution</div>
              <div className="p-2 rounded bg-black/60 border border-white/10 text-cyan-300 flex items-center gap-2 select-text">
                <span className="text-gray-500 select-none">$</span>
                <span className="font-semibold">{cmd}</span>
              </div>
            </div>
          ) : hasCustomArgs ? (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Arguments</div>
              <pre className="p-1.5 rounded bg-white/5 text-gray-300 overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-36 font-mono text-[10.5px]">
                {isNodeRepl && toolCall.args?.code ? toolCall.args.code : JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </div>
          ) : null}

          {toolCall.result && !['executed', '(Completed)'].includes(String(toolCall.result).trim()) ? (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Result Output</div>
              <pre className={clsx(
                "p-1.5 rounded overflow-x-auto custom-scrollbar whitespace-pre-wrap max-h-40 font-mono text-[10.5px]",
                toolCall.status === 'failed' ? "bg-rose-950/20 text-rose-300 border border-rose-500/20" : "bg-white/5 text-gray-200"
              )}>
                {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          ) : (
            <div className={clsx("text-[10px] italic flex items-center gap-1", toolCall.status === 'failed' ? "text-rose-400" : "text-emerald-400/90")}>
              {toolCall.status === 'failed' ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
              <span>{toolCall.status === 'failed' ? 'Process exited with non-zero failure code.' : 'Execution completed successfully with exit code 0.'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
