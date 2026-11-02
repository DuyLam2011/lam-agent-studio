import React, { useState } from 'react';
import { Play, Plus, Sparkles, Trash2, X, Loader2, Workflow, ChevronDown } from 'lucide-react';
import { NODE_CATALOG, PRESET_PIPELINES } from './automationConstants';
import { AutomationCategory, AutomationPipeline } from '../../types/automation';

interface ToolbarProps {
  pipeline: AutomationPipeline;
  isRunning: boolean;
  onRunPipeline: () => void;
  onAddNode: (category: AutomationCategory, name: string, sublabel: string, config: any) => void;
  onSelectTemplate: (template: AutomationPipeline) => void;
  onClear: () => void;
  onClose: () => void;
}

export const AutomationToolbar: React.FC<ToolbarProps> = ({
  pipeline,
  isRunning,
  onRunPipeline,
  onAddNode,
  onSelectTemplate,
  onClear,
  onClose
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="h-12 border-b border-border surface-header px-4 flex items-center justify-between shrink-0 select-none z-40">
      {/* Title & Info */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
          <Workflow size={15} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-app-text tracking-wide flex items-center gap-2">
            <span>{pipeline.name}</span>
            <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-white/10 text-app-muted">
              {pipeline.nodes.length} nodes • {pipeline.edges.length} wires
            </span>
          </h3>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-2 relative">
        {/* Add Node Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowAddMenu(!showAddMenu); setShowTemplates(false); }}
            className="px-2.5 py-1.5 rounded-xl surface-card hover:bg-white/10 text-app-text text-xs font-medium flex items-center gap-1.5 border border-border transition-colors"
          >
            <Plus size={13} className="text-primary" />
            <span>Add Node</span>
            <ChevronDown size={11} className="text-app-muted" />
          </button>

          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-60 surface-dropdown shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="px-2 py-1 text-[9px] font-bold text-app-muted uppercase font-mono">Catalog Nodes</div>
              {NODE_CATALOG.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onAddNode(item.category, item.name, item.sublabel, item.defaultConfig);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex flex-col items-start px-2 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
                >
                  <span className="text-xs font-medium text-app-text">{item.name}</span>
                  <span className="text-[10px] text-app-muted">{item.sublabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowTemplates(!showTemplates); setShowAddMenu(false); }}
            className="px-2.5 py-1.5 rounded-xl surface-card hover:bg-white/10 text-app-text text-xs font-medium flex items-center gap-1.5 border border-border transition-colors"
          >
            <Sparkles size={13} className="text-purple-400" />
            <span>Templates</span>
          </button>

          {showTemplates && (
            <div className="absolute top-full left-0 mt-1.5 w-64 surface-dropdown shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[9px] font-bold text-app-muted uppercase font-mono">Pre-built Automations</div>
              {PRESET_PIPELINES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onSelectTemplate(t); setShowTemplates(false); }}
                  className="w-full flex flex-col items-start px-2 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors"
                >
                  <span className="text-xs font-medium text-app-text">{t.name}</span>
                  <span className="text-[10px] text-app-muted truncate w-full">{t.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClear}
          className="p-1.5 rounded-xl surface-card hover:bg-rose-500/20 text-app-muted hover:text-rose-400 border border-border transition-colors"
          title="Clear canvas"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Right: Run & Close */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunPipeline}
          disabled={isRunning || pipeline.nodes.length === 0}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
        >
          {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
          <span>{isRunning ? 'Executing Pipeline...' : 'Run Automation'}</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-app-muted hover:text-app-text hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
