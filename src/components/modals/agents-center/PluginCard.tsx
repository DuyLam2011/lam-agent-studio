import React from 'react';
import { Cpu, Terminal, Globe, Folder, GitBranch, Trash2, CheckCircle, AlertCircle, Radio, Lock } from 'lucide-react';
import { McpServerPlugin } from '../../../types/plugins';
import { useAgentStore } from '../../../store/useAgentStore';
import clsx from 'clsx';

interface PluginCardProps {
  plugin: McpServerPlugin;
  currentScopeTargetId?: string;
}

export const PluginCard: React.FC<PluginCardProps> = ({ plugin, currentScopeTargetId }) => {
  const { togglePluginActive, deletePlugin, addToast } = useAgentStore();
  const isExcluded = Boolean(currentScopeTargetId && plugin.disabledIn?.includes(currentScopeTargetId));
  const isSwitchActive = plugin.active && !isExcluded;

  const getScopeBadge = () => {
    switch (plugin.scope) {
      case 'global': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono flex items-center gap-1"><Globe size={9} /> GLOBAL</span>;
      case 'workspace': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1"><Folder size={9} /> WORKSPACE</span>;
      case 'repo': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1"><GitBranch size={9} /> REPO</span>;
    }
  };

  const getStatusBadge = () => {
    switch (plugin.status) {
      case 'connected': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle size={9} /> Ready</span>;
      case 'error': return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"><AlertCircle size={9} /> Error</span>;
      default: return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 flex items-center gap-1"><Radio size={9} /> Standby</span>;
    }
  };

  return (
    <div className={clsx(
      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
      isSwitchActive ? "bg-white/5 border-white/10 hover:border-white/20 shadow-lg" : "bg-black/20 border-white/5 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"><Cpu size={13} /></div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-200 truncate">{plugin.name}</span>
              {getScopeBadge()}
              {getStatusBadge()}
              {isExcluded && <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono">Disabled for this scope</span>}
              <span className="text-[9px] text-gray-400 bg-black/40 px-1.5 py-0.5 rounded font-mono uppercase">{plugin.type}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{plugin.description}</p>
          </div>
        </div>

        {plugin.scope === 'repo' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Repository MCP plugins are locked to codebase and always active">
            <Lock size={10} className="text-amber-400" /><span>Repo Enforced</span>
          </div>
        ) : plugin.scope === 'workspace' ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-mono shrink-0 select-none shadow-sm" title="Workspace MCP plugins are locked to workspace and always active">
            <Lock size={10} className="text-purple-400" /><span>Workspace Enforced</span>
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={isSwitchActive}
            onClick={(e) => {
              e.stopPropagation();
              togglePluginActive(plugin.id, !isSwitchActive, currentScopeTargetId);
            }}
            className={clsx("w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 mt-0.5 p-0.5 cursor-pointer", isSwitchActive ? "bg-emerald-500" : "bg-white/10")}
            title={isSwitchActive ? (currentScopeTargetId ? "Active for this scope. Click to disable here." : "Plugin connected & active") : (isExcluded ? "Disabled for this scope. Click to enable here." : "Plugin disconnected")}
          >
            <div className={clsx("w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200", isSwitchActive ? "translate-x-4" : "translate-x-0")} />
          </button>
        )}
      </div>

      <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono bg-black/30 px-2 py-1 rounded-lg border border-white/5 truncate">
          <Terminal size={11} className="text-gray-500 shrink-0" /><span className="truncate">{plugin.command} {plugin.args?.join(' ')}</span>
        </div>

        {plugin.toolsExposed && plugin.toolsExposed.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mr-1">Tools:</span>
            {plugin.toolsExposed.map((tool) => (
              <span key={tool} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-mono">{tool}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500 font-mono">
        <span className="text-[10px] text-gray-400 font-mono">Protocol: Model Context Protocol (MCP v1)</span>
        {plugin.scope === 'global' && (
          <button
            onClick={() => {
              deletePlugin(plugin.id);
              addToast(`Removed plugin: ${plugin.name}`, 'info');
            }}
            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete Plugin"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};
