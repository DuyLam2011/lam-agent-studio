import React, { useState } from 'react';
import { Plus, Cpu, Search, Sparkles, Globe, Folder, GitBranch } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { PluginCard } from './PluginCard';
import { McpServerPlugin } from '../../../types/plugins';
import { ScopeAccordion } from './ScopeAccordion';

export const PluginsTab: React.FC = () => {
  const { currentRuleScope, systemContext, mcpPlugins, addPlugin, addToast, setImportModalOpen } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ global: true, workspace: true, repo: true });

  const activeWs = currentRuleScope.workspaceId
    ? systemContext.workspaces.find(w => w.id === currentRuleScope.workspaceId)
    : systemContext.workspaces.find(w => w.folders.includes(currentRuleScope.repoPath || ''));
  const repoName = currentRuleScope.repoPath?.split(/[/\\]/).pop();
  const targetScopeId = currentRuleScope.type === 'repo' ? currentRuleScope.repoPath : (currentRuleScope.type === 'workspace' ? currentRuleScope.workspaceId : undefined);

  const filterItem = (p: McpServerPlugin) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.command.toLowerCase().includes(q) || p.toolsExposed.some(t => t.toLowerCase().includes(q));
  };

  const globalPlugins = mcpPlugins.filter(p => p.scope === 'global' && filterItem(p));
  const workspacePlugins = mcpPlugins.filter(p => p.scope === 'workspace' && (!activeWs || p.targetId === activeWs.id) && filterItem(p));
  const repoPlugins = mcpPlugins.filter(p => p.scope === 'repo' && (!currentRuleScope.repoPath || p.targetId === currentRuleScope.repoPath) && filterItem(p));

  const handleCreatePlugin = () => {
    const targetScope = currentRuleScope.type === 'workspace' ? 'workspace' : currentRuleScope.type === 'repo' ? 'repo' : 'global';
    const newPlugin: McpServerPlugin = {
      id: `plugin-${Date.now()}`,
      name: 'Custom MCP Server',
      description: 'Custom external Model Context Protocol server exposing custom tools.',
      type: 'mcp',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everything'],
      toolsExposed: ['sample_tool', 'echo_query'],
      status: 'connected',
      scope: targetScope,
      targetId: targetScope === 'workspace' ? currentRuleScope.workspaceId : (targetScope === 'repo' ? currentRuleScope.repoPath : undefined),
      active: true,
      updatedAt: Date.now()
    };
    addPlugin(newPlugin);
    addToast('Registered new MCP server plugin', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900">
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-gray-200">Plugins & Model Context Protocol Hub</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xl">
            External tool servers across Global (overridable), Workspace (enforced), and Repo scopes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles size={13} className="text-purple-300" />
            <span>Import MCP</span>
          </button>
          <button
            onClick={handleCreatePlugin}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            <Plus size={13} />
            <span>New MCP Server</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-white/5 bg-black/10 flex items-center gap-2">
        <Search size={13} className="text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter MCP servers by name, command, or exposed tools..."
          className="bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        <ScopeAccordion
          title="Global MCP Servers"
          subtitle={targetScopeId ? "Inherited baseline (Toggle switch to exclude for this target)" : "Available across all workspaces"}
          icon={Globe}
          iconColor="text-cyan-400"
          badgeCount={globalPlugins.length}
          badgeColor="cyan"
          isOpen={openSections.global}
          onToggle={() => setOpenSections(s => ({ ...s, global: !s.global }))}
          emptyMessage="No global MCP servers configured."
        >
          {globalPlugins.map(plugin => <PluginCard key={plugin.id} plugin={plugin} currentScopeTargetId={targetScopeId} />)}
        </ScopeAccordion>

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Workspace MCP Integrations"
            subtitle={activeWs ? `Workspace: ${activeWs.name} (Enforced)` : 'All workspaces (Enforced)'}
            icon={Folder}
            iconColor="text-purple-400"
            badgeCount={workspacePlugins.length}
            badgeColor="purple"
            isOpen={openSections.workspace}
            onToggle={() => setOpenSections(s => ({ ...s, workspace: !s.workspace }))}
            emptyMessage="No workspace MCP servers configured."
          >
            {workspacePlugins.map(plugin => <PluginCard key={plugin.id} plugin={plugin} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}

        {(currentRuleScope.type === 'all' || currentRuleScope.type === 'workspace' || currentRuleScope.type === 'repo') && (
          <ScopeAccordion
            title="Repository MCP Bridges"
            subtitle={repoName ? `Repo: ${repoName} (Git Enforced)` : 'All repositories (Git Enforced)'}
            icon={GitBranch}
            iconColor="text-amber-400"
            badgeCount={repoPlugins.length}
            badgeColor="amber"
            isOpen={openSections.repo}
            onToggle={() => setOpenSections(s => ({ ...s, repo: !s.repo }))}
            emptyMessage="No repository MCP servers configured."
          >
            {repoPlugins.map(plugin => <PluginCard key={plugin.id} plugin={plugin} currentScopeTargetId={targetScopeId} />)}
          </ScopeAccordion>
        )}
      </div>
    </div>
  );
};
