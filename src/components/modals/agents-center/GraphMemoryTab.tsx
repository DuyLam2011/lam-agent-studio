import React, { useState, useEffect } from 'react';
import { Network, Search, RefreshCw } from 'lucide-react';
import { useAgentStore } from '../../../store/useAgentStore';
import { CodeGraphData, GraphQueryResult, CodeGraphNode } from '../../../types/code-graph';
import { GraphStatsCards } from './GraphStatsCards';
import { GraphNodeDetailPanel } from './GraphNodeDetailPanel';
import clsx from 'clsx';

export const GraphMemoryTab: React.FC = () => {
  const { systemContext, projectMemories, addToast } = useAgentStore();
  const [graphData, setGraphData] = useState<CodeGraphData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [queryResult, setQueryResult] = useState<GraphQueryResult | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CodeGraphNode | null>(null);

  const wsRoot = systemContext.cwd || '.';

  const loadGraph = async () => {
    // @ts-ignore
    const api = window.lamApi?.graph;
    if (!api?.get) return;
    try {
      const data = await api.get(wsRoot);
      if (data) {
        setGraphData(data);
        const first = Object.values(data.nodes || {})[0];
        if (first && !selectedNode) setSelectedNode(first as CodeGraphNode);
      }
    } catch (e: any) {
      addToast(`Failed to load code graph: ${e.message}`, 'error');
    }
  };

  const handleReindex = async () => {
    // @ts-ignore
    const api = window.lamApi?.graph;
    if (!api?.build) return;
    setReindexing(true);
    try {
      const data = await api.build(wsRoot, projectMemories);
      if (data) {
        setGraphData(data);
        addToast(`Graphify indexed ${data.stats.totalFiles} files & ${data.stats.totalSymbols} symbols!`, 'success');
      }
    } catch (e: any) {
      addToast(`Index error: ${e.message}`, 'error');
    } finally {
      setReindexing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // @ts-ignore
    const api = window.lamApi?.graph;
    if (!api?.query) return;
    try {
      const res = await api.query(searchQuery.trim(), wsRoot);
      if (res) {
        setQueryResult(res);
        if (res.matchedNodes?.length > 0) setSelectedNode(res.matchedNodes[0]);
      }
    } catch {}
  };

  useEffect(() => { void loadGraph(); }, [wsRoot]);

  const stats = graphData?.stats || { totalFiles: 0, totalSymbols: 0, totalMemories: 0, totalEdges: 0, indexedAt: 0 };
  const allNodes = Object.values(graphData?.nodes || {}) as CodeGraphNode[];
  const topCentral = [...allNodes].sort((a, b) => (b.centralityScore || 0) - (a.centralityScore || 0)).slice(0, 6);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent text-xs">
      <div className="p-4 surface-header flex items-center justify-between gap-4 shrink-0 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <Network size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-app-text">Graphify Studio: Code & Memory Knowledge Graph</h3>
          </div>
          <p className="text-xs text-muted mt-0.5">Deterministic AST symbol mapping & HippoRAG multi-hop associative agent memory.</p>
        </div>
        <button
          onClick={handleReindex} disabled={reindexing}
          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={reindexing ? "animate-spin" : ""} />
          <span>{reindexing ? 'Indexing AST...' : 'Re-index Code Graph'}</span>
        </button>
      </div>

      <GraphStatsCards stats={stats} />

      <form onSubmit={handleSearch} className="px-4 pb-2 flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code symbol, function, or concept (e.g. useAgentStore, ToolExecutor)..."
            className="w-full surface-input pl-8 pr-3 py-1.5 rounded-xl text-xs text-app-text placeholder:text-muted outline-none border border-subtle focus:border-primary"
          />
        </div>
        <button type="submit" className="px-3 py-1.5 rounded-xl bg-primary text-white font-semibold text-xs flex items-center gap-1 cursor-pointer">
          <Search size={12} /><span>Graph Query</span>
        </button>
      </form>

      <div className="flex-1 flex overflow-hidden px-4 pb-4 gap-3">
        <div className="w-64 surface-card rounded-xl border border-subtle p-3 flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="text-[10.5px] font-bold text-muted uppercase tracking-wider">Top Architectural Hubs</div>
          {topCentral.map((n) => (
            <button
              key={n.id} onClick={() => setSelectedNode(n)}
              className={clsx("p-2 rounded-lg text-left transition-all border cursor-pointer flex flex-col gap-0.5", selectedNode?.id === n.id ? "bg-primary/15 border-primary" : "surface-input border-subtle hover:border-white/20")}
            >
              <div className="font-mono text-xs font-semibold text-app-text truncate">{n.name}</div>
              <div className="flex items-center justify-between text-[9.5px] text-muted">
                <span className="uppercase">{n.type}</span>
                <span className="text-primary font-bold">Centrality: {n.centralityScore || 0}</span>
              </div>
            </button>
          ))}
        </div>

        <GraphNodeDetailPanel selectedNode={selectedNode} queryResult={queryResult} />
      </div>
    </div>
  );
};
