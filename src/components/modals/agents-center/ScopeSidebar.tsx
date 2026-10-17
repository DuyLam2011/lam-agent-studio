import React, { useState } from 'react';
import { Globe, Folder, GitBranch, RefreshCw, Layers } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { RuleScope } from '../../../types/rules';
import clsx from 'clsx';

const SCOPES: Record<string, { title: string; global: string; unit: string }> = {
  rules: { title: 'Rule Scope', global: 'Global Rules', unit: 'rule' },
  skills: { title: 'Skill Scope', global: 'Global Skills', unit: 'skill' },
  workflows: { title: 'Pipeline Scope', global: 'Global Pipelines', unit: 'pipeline' },
  plugins: { title: 'MCP Scope', global: 'Global MCP Hub', unit: 'plugin' },
  subagents: { title: 'Persona Scope', global: 'Global Personas', unit: 'persona' },
  memory: { title: 'Memory Scope', global: 'Global ADRs', unit: 'memory' }
};

export const ScopeSidebar: React.FC = () => {
  const {
    systemContext, currentRuleScope, setCurrentRuleScope,
    detectedRepoRules, detectedRepoSkills, agentWorkflows,
    mcpPlugins, subagentPersonas, projectMemories,
    scanAllWorkspaceRules, scanAllWorkspaceSkills,
    agentsCenterTab, addToast
  } = useAgentStore();

  const [isScanning, setIsScanning] = useState(false);
  const meta = SCOPES[agentsCenterTab] || SCOPES.rules;

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await Promise.all([scanAllWorkspaceRules(), scanAllWorkspaceSkills()]);
      addToast('Scanned all repositories for configurations', 'success');
    } catch {
      addToast('Failed to scan repositories', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const isScopeActive = (s: RuleScope) => (
    s.type === currentRuleScope.type &&
    (s.type !== 'workspace' || s.workspaceId === currentRuleScope.workspaceId) &&
    (s.type !== 'repo' || s.repoPath === currentRuleScope.repoPath)
  );

  const getRepoCount = (path: string) => {
    switch (agentsCenterTab) {
      case 'rules': return detectedRepoRules.filter(r => r.repoPath === path).length;
      case 'skills': return detectedRepoSkills.filter(s => s.repoPath === path).length;
      case 'workflows': return agentWorkflows.filter(w => w.scope === 'repo' && w.targetId === path).length;
      case 'plugins': return mcpPlugins.filter(p => p.scope === 'repo' && p.targetId === path).length;
      case 'subagents': return subagentPersonas.filter(s => s.scope === 'repo' && s.targetId === path).length;
      case 'memory': return projectMemories.filter(m => m.scope === 'repo' && m.targetId === path).length;
      default: return 0;
    }
  };

  return (
    <div className="w-64 bg-black/40 border-r border-white/10 flex flex-col shrink-0 select-none">
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{meta.title}</span>
        <button onClick={handleScan} disabled={isScanning} className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 hover:bg-white/5 p-1 rounded transition-colors" title="Scan repositories">
          <RefreshCw size={11} className={clsx(isScanning && "animate-spin text-primary")} />
          <span>Scan</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        <button
          onClick={() => setCurrentRuleScope({ type: 'all' })}
          className={clsx("w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left", isScopeActive({ type: 'all' }) ? "bg-purple-600/20 text-white border border-purple-500/40 shadow-md" : "text-gray-400 hover:bg-white/5 hover:text-gray-200")}
        >
          <Layers size={14} className="text-purple-400 shrink-0" />
          <div className="truncate"><div>All Scopes (Overview)</div><div className="text-[9px] text-gray-500 font-normal">Global, Workspace & Repos</div></div>
        </button>

        <button
          onClick={() => setCurrentRuleScope({ type: 'global' })}
          className={clsx("w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left", isScopeActive({ type: 'global' }) ? "bg-primary/20 text-white border border-primary/40 shadow-md" : "text-gray-400 hover:bg-white/5 hover:text-gray-200")}
        >
          <Globe size={14} className="text-cyan-400 shrink-0" />
          <div className="truncate"><div>{meta.global}</div><div className="text-[9px] text-gray-500 font-normal">Applies across all projects</div></div>
        </button>

        <div className="space-y-1 pt-1 border-t border-white/5">
          <div className="px-2 py-0.5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">Workspaces & Repos</div>
          {systemContext.workspaces.map((ws) => (
            <div key={ws.id} className="space-y-1">
              <button
                onClick={() => setCurrentRuleScope({ type: 'workspace', workspaceId: ws.id })}
                className={clsx("w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left font-medium", isScopeActive({ type: 'workspace', workspaceId: ws.id }) ? "bg-primary/20 text-white border border-primary/40" : "text-gray-300 hover:bg-white/5")}
              >
                <div className="flex items-center gap-2 truncate"><Folder size={13} className="text-primary shrink-0" /><span className="truncate">{ws.name}</span></div>
                <span className="text-[9px] text-gray-500 font-mono">ws</span>
              </button>

              {ws.folders && ws.folders.length > 0 && (
                <div className="pl-4 space-y-0.5 border-l border-white/5 ml-3">
                  {ws.folders.map((repoPath) => {
                    const count = getRepoCount(repoPath);
                    return (
                      <button
                        key={repoPath}
                        onClick={() => setCurrentRuleScope({ type: 'repo', workspaceId: ws.id, repoPath })}
                        className={clsx("w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition-colors text-left", isScopeActive({ type: 'repo', workspaceId: ws.id, repoPath }) ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40" : "text-gray-400 hover:bg-white/5 hover:text-gray-200")}
                        title={repoPath}
                      >
                        <div className="flex items-center gap-1.5 truncate"><GitBranch size={11} className="text-amber-400 shrink-0" /><span className="truncate">{repoPath.split(/[/\\]/).pop() || repoPath}</span></div>
                        {count > 0 && <span className="text-[8px] bg-white/10 text-gray-300 px-1 rounded font-mono">{count} {meta.unit}{count > 1 ? 's' : ''}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
