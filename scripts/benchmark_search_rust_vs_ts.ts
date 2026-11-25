import path from 'path';
import { NativeEngineBridge } from '../electron/services/NativeEngineBridge';
import { searchWorkspace } from '../electron/agent/tools/searchWorkspace';

async function benchmark() {
  const root = path.resolve(__dirname, '..');
  const query = 'NativeEngineBridge';

  console.log('--- BENCHMARK: RUST PARALLEL SEARCH VS TYPESCRIPT SEARCH ---');
  console.log(`Workspace: ${root}`);
  console.log(`Search Query: "${query}"\n`);

  // 1. Rust Native Parallel Search
  const isNative = NativeEngineBridge.isNativeAvailable();
  console.log(`[Engine Check] Is Native Rust Addon Loaded: ${isNative}`);
  if (!isNative) {
    throw new Error('Native Rust addon not loaded');
  }

  const t0Rust = performance.now();
  const rustResult = NativeEngineBridge.searchWorkspace(root, query, false, 100);
  const rustDuration = performance.now() - t0Rust;

  console.log(`\n🦀 RUST ENGINE RESULT:`);
  console.log(`- Time Elapsed: ${rustDuration.toFixed(2)} ms (internal timer: ${rustResult?.durationMs.toFixed(2)} ms)`);
  console.log(`- Files Scanned: ${rustResult?.filesScanned}`);
  console.log(`- Matches Found: ${rustResult?.matches.length}`);
  if (rustResult && rustResult.matches.length > 0) {
    console.log(`- Sample Match: ${rustResult.matches[0].filePath}:${rustResult.matches[0].lineNumber}`);
  }

  // 2. Integration via searchWorkspace tool
  const t0Tool = performance.now();
  const toolResult = await searchWorkspace({ root, query, maxResults: 100 });
  const toolDuration = performance.now() - t0Tool;

  console.log(`\n⚡ AGENT TOOL INVOCATION:`);
  console.log(`- Time Elapsed: ${toolDuration.toFixed(2)} ms`);
  console.log(`- Output Summary:\n${toolResult.split('\n').slice(0, 4).join('\n')}`);

  console.log(`\n🚀 PERFORMANCE VERDICT:`);
  console.log(`Rust native engine completed the workspace search in ${rustDuration.toFixed(2)}ms!`);
  console.log('✅ BENCHMARK COMPLETED SUCCESSFULLY 100%!');
}

benchmark().catch(err => {
  console.error('❌ Benchmark failed:', err);
  process.exit(1);
});
