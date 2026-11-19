import { GraphifyStudioService } from '../electron/services/GraphifyStudioService';
import { ProjectMemoryItem } from '../src/types/memory';

export async function runGraphifyStudioTests(): Promise<{ passed: boolean; details: string }> {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  log('🧪 Starting Graphify Studio & HippoRAG Memory Test Suite...');

  const cwd = process.cwd();

  // Test 1: Build Knowledge Graph with Sample Memories
  const sampleMemories: ProjectMemoryItem[] = [
    {
      id: 'mem-rule-4',
      title: 'Rule 4: Modular Component Standard',
      category: 'architecture',
      content: 'All source files must strictly remain under 150 lines. Large components must be refactored into submodules.',
      scope: 'global',
      pinned: true
    },
    {
      id: 'mem-term-wsl',
      title: 'Windows Subsystem for Linux Execution',
      category: 'decision',
      content: 'ExecutionEnvironmentService and ToolExecutor execute commands in WSL with path translation.',
      scope: 'workspace',
      pinned: true
    }
  ];

  const graph = await GraphifyStudioService.buildCodeGraph(cwd, sampleMemories);

  if (!graph || graph.stats.totalFiles === 0) {
    throw new Error(`Graph indexing produced no files: ${JSON.stringify(graph.stats)}`);
  }
  if (graph.stats.totalSymbols === 0) {
    throw new Error(`Graph indexing produced no symbols: ${JSON.stringify(graph.stats)}`);
  }
  log(`  ✅ Graphify AST index complete: ${graph.stats.totalFiles} files, ${graph.stats.totalSymbols} symbols, ${graph.stats.totalEdges} relationships`);

  // Test 2: In-Degree Centrality Invariant
  const highCentral = Object.values(graph.nodes).filter((n) => (n.centralityScore || 0) > 0);
  if (highCentral.length === 0) {
    throw new Error('Expected at least one node with in-degree centrality > 0');
  }
  const topHub = highCentral.sort((a, b) => (b.centralityScore || 0) - (a.centralityScore || 0))[0];
  log(`  ✅ Architectural Hub identified: "${topHub.name}" (${topHub.type}) with centrality score ${topHub.centralityScore}`);

  // Test 3: Associative Multi-Hop Query & Memory Recall (HippoRAG style)
  const queryRes = await GraphifyStudioService.queryGraph(cwd, 'ToolExecutor');
  if (queryRes.matchedNodes.length === 0) {
    throw new Error('Failed to match ToolExecutor in code graph query');
  }
  log(`  ✅ Query matched: "${queryRes.query}" -> ${queryRes.matchedNodes.length} nodes, ${queryRes.subgraphNodes.length} neighborhood entities`);

  if (!queryRes.retrievalContext.includes('[GRAPH KNOWLEDGE RETRIEVAL]')) {
    throw new Error('Invalid retrievalContext format');
  }
  log(`  ✅ HippoRAG Context generated: ${queryRes.retrievalContext.length} chars`);

  // Test 4: Token Optimization Calculation
  const savings = queryRes.tokensSaved;
  if (savings.savedPercentage < 40) {
    throw new Error(`Token savings percentage too low: ${savings.savedPercentage}%`);
  }
  log(`  ✅ Token Optimization Verified: ~${savings.graphTokensEstimate} tokens vs ~${savings.rawTokensEstimate} raw tokens (${savings.savedPercentage}% token reduction)`);

  return { passed: true, details: logs.join('\n') };
}

if (require.main === module) {
  runGraphifyStudioTests()
    .then((r) => {
      console.log(r.details);
      console.log('🎉 All Graphify Studio & Memory Optimization tests passed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Graphify Studio test failed:', err);
      process.exit(1);
    });
}
