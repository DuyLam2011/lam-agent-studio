import React from 'react';
import { X, Sliders, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AutomationNode } from '../../types/automation';

interface NodeConfigInspectorProps {
  node: AutomationNode | null;
  onUpdateConfig: (nodeId: string, patch: Partial<AutomationNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeConfigInspector: React.FC<NodeConfigInspectorProps> = ({
  node,
  onUpdateConfig,
  onDeleteNode,
  onClose
}) => {
  if (!node) return null;

  const handleConfigChange = (key: string, value: any) => {
    onUpdateConfig(node.id, {
      config: { ...node.config, [key]: value }
    });
  };

  return (
    <div className="w-80 surface-panel border-l border-border h-full flex flex-col p-4 z-30 shadow-2xl animate-in slide-in-from-right-4 duration-150 overflow-y-auto custom-scrollbar text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-primary" />
          <h3 className="font-semibold text-app-text uppercase tracking-wider text-[11px]">Node Parameters</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-app-muted hover:text-app-text hover:bg-white/10 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="py-3 space-y-3.5 flex-1">
        {/* Name & Sublabel */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-app-muted uppercase">Node Label</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdateConfig(node.id, { name: e.target.value })}
            className="w-full surface-input rounded-xl px-2.5 py-1.5 text-xs text-app-text focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Dynamic Tool Config */}
        {node.category === 'tool' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase">Execution Command / Tool</label>
            <input
              type="text"
              value={node.config.command || ''}
              onChange={(e) => handleConfigChange('command', e.target.value)}
              placeholder="e.g. npm test or git status"
              className="w-full surface-input font-mono rounded-xl px-2.5 py-1.5 text-xs text-app-text focus:outline-none focus:border-primary/50"
            />
          </div>
        )}

        {/* Dynamic Agent Config */}
        {node.category === 'agent' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase">Agent Directive / Prompt</label>
            <textarea
              rows={3}
              value={node.config.prompt || ''}
              onChange={(e) => handleConfigChange('prompt', e.target.value)}
              placeholder="Instructions dispatched to autonomous subagent..."
              className="w-full surface-input rounded-xl px-2.5 py-1.5 text-xs text-app-text focus:outline-none focus:border-primary/50 resize-none custom-scrollbar"
            />
          </div>
        )}

        {/* Dynamic Output Config */}
        {node.category === 'output' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-app-muted uppercase">Notification Alert Text</label>
            <input
              type="text"
              value={node.config.message || ''}
              onChange={(e) => handleConfigChange('message', e.target.value)}
              className="w-full surface-input rounded-xl px-2.5 py-1.5 text-xs text-app-text focus:outline-none focus:border-primary/50"
            />
          </div>
        )}

        {/* Last Result Inspector */}
        {node.lastResult && (
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[9px] font-mono uppercase text-app-muted flex items-center gap-1">
              {node.status === 'success' ? <CheckCircle2 size={11} className="text-emerald-400" /> : <AlertCircle size={11} className="text-rose-400" />}
              Output Stream
            </span>
            <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-gray-300 max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
              {typeof node.lastResult === 'string' ? node.lastResult : JSON.stringify(node.lastResult, null, 2)}
            </div>
          </div>
        )}
      </div>

      {/* Delete Node Action */}
      <button
        onClick={() => { onDeleteNode(node.id); onClose(); }}
        className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center gap-1.5 transition-colors shrink-0"
      >
        <Trash2 size={12} />
        <span>Remove Node</span>
      </button>
    </div>
  );
};
