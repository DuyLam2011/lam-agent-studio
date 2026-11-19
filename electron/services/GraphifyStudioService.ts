import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { CodeGraphData, CodeGraphNode, CodeGraphEdge, GraphQueryResult } from '../../src/types/code-graph';
import { ProjectMemoryItem } from '../../src/types/memory';
import { GraphAstParser } from './GraphAstParser';

export class GraphifyStudioService {
  private static cachedGraph: CodeGraphData | null = null;
  private static activeWorkspace: string = '';

  public static getGraphPath(workspaceRoot: string): string {
    return path.join(workspaceRoot, '.agents', 'graph', 'code_graph.json');
  }

  public static async buildCodeGraph(workspaceRoot: string, memories: ProjectMemoryItem[] = []): Promise<CodeGraphData> {
    const nodes: Record<string, CodeGraphNode> = {};
    const edges: CodeGraphEdge[] = [];
    const files = await GraphAstParser.scanSourceFiles(workspaceRoot);

    for (const relFile of files) {
      const fileId = `file:${relFile}`;
      nodes[fileId] = { id: fileId, name: path.basename(relFile), type: 'file', filePath: relFile };
      try {
        const full = path.join(workspaceRoot, relFile);
        const content = await fs.readFile(full, 'utf-8');
        GraphAstParser.parseFileSymbols(relFile, content, nodes, edges);
      } catch {}
    }

    for (const mem of memories) {
      const memId = `mem:${mem.id}`;
      nodes[memId] = { id: memId, name: mem.title, type: 'memory', description: mem.content, metadata: { category: mem.category, scope: mem.scope } };
      for (const [nodeId, node] of Object.entries(nodes)) {
        if (node.type !== 'memory' && (mem.content.includes(node.name) || mem.title.includes(node.name))) {
          edges.push({ source: memId, target: nodeId, type: node.type === 'file' ? 'targets_file' : 'targets_symbol', weight: 1.0 });
        }
      }
    }

    for (const edge of edges) {
      if (nodes[edge.target]) nodes[edge.target].centralityScore = (nodes[edge.target].centralityScore || 0) + 1;
    }

    const graph: CodeGraphData = {
      nodes, edges,
      stats: {
        totalFiles: files.length,
        totalSymbols: Object.values(nodes).filter((n) => n.type !== 'file' && n.type !== 'memory').length,
        totalMemories: memories.length,
        totalEdges: edges.length,
        indexedAt: Date.now()
      }
    };

    const outDir = path.dirname(this.getGraphPath(workspaceRoot));
    if (!fsSync.existsSync(outDir)) await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(this.getGraphPath(workspaceRoot), JSON.stringify(graph, null, 2), 'utf-8');
    this.cachedGraph = graph;
    this.activeWorkspace = workspaceRoot;
    return graph;
  }

  public static async getGraph(workspaceRoot: string): Promise<CodeGraphData> {
    if (this.cachedGraph && this.activeWorkspace === workspaceRoot) return this.cachedGraph;
    const p = this.getGraphPath(workspaceRoot);
    if (fsSync.existsSync(p)) {
      try {
        const raw = await fs.readFile(p, 'utf-8');
        this.cachedGraph = JSON.parse(raw);
        this.activeWorkspace = workspaceRoot;
        return this.cachedGraph!;
      } catch {}
    }
    return this.buildCodeGraph(workspaceRoot);
  }

  public static async queryGraph(workspaceRoot: string, query: string): Promise<GraphQueryResult> {
    const graph = await this.getGraph(workspaceRoot);
    const qLower = query.toLowerCase().trim();
    const matched = Object.values(graph.nodes).filter((n) => n.name.toLowerCase().includes(qLower) || n.filePath?.toLowerCase().includes(qLower));

    const subNodes = new Map<string, CodeGraphNode>();
    const subEdges: CodeGraphEdge[] = [];
    const seedIds = new Set<string>();

    matched.slice(0, 5).forEach((n) => { subNodes.set(n.id, n); seedIds.add(n.id); });

    for (const edge of graph.edges) {
      if (seedIds.has(edge.source) || seedIds.has(edge.target)) {
        subEdges.push(edge);
        if (graph.nodes[edge.source]) subNodes.set(edge.source, graph.nodes[edge.source]);
        if (graph.nodes[edge.target]) subNodes.set(edge.target, graph.nodes[edge.target]);
      }
    }

    const subNodeList = Array.from(subNodes.values());
    const linkedMemories = subNodeList.filter((n) => n.type === 'memory').map((m) => ({
      id: m.id.replace(/^mem:/, ''), title: m.name, category: m.metadata?.category || 'decision',
      content: m.description || '', scope: m.metadata?.scope || 'workspace', pinned: true
    }));

    const lines: string[] = [`[GRAPH KNOWLEDGE RETRIEVAL]: "${query}"`];
    subNodeList.forEach((n) => lines.push(`- (${n.type.toUpperCase()}) ${n.name}${n.filePath ? ` [${n.filePath}]` : ''}${n.centralityScore ? ` · Centrality: ${n.centralityScore}` : ''}`));
    if (linkedMemories.length) {
      lines.push('\n[ASSOCIATED AGENT MEMORIES]:');
      linkedMemories.forEach((m) => lines.push(`* [${m.category.toUpperCase()}] ${m.title}: ${m.content}`));
    }

    const rawEst = Math.min(graph.stats.totalFiles * 250, 8000);
    const graphEst = lines.join('\n').length / 4;

    return {
      query, matchedNodes: matched, subgraphNodes: subNodeList, subgraphEdges: subEdges, linkedMemories,
      retrievalContext: lines.join('\n'),
      tokensSaved: { rawTokensEstimate: rawEst, graphTokensEstimate: Math.round(graphEst), savedPercentage: Math.max(10, Math.round(((rawEst - graphEst) / rawEst) * 100)) }
    };
  }
}
