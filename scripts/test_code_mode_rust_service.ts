import path from 'path';
import { CodeModeService } from '../electron/services/CodeModeService';
import { ToolExecutor } from '../electron/agent/tools/ToolExecutor';
import { NativeEngineBridge } from '../electron/services/NativeEngineBridge';

async function main() {
  console.log('🧪 Starting Verification: Code Mode Native Rust Service & Harness...\n');
  const root = path.resolve(__dirname, '..');

  // 1. Verify Code Mode is Default
  console.log('Pass 1: Checking Code Mode default state...');
  const isDefault = CodeModeService.isEnabled();
  console.log(`- Code Mode is default: ${isDefault}`);
  if (!isDefault) throw new Error('Code Mode must be enabled by default');

  // 2. Verify Native Rust Distillation Unit
  console.log('\nPass 2: Testing native Rust context distillation...');
  const rawSpamText = Array.from({ length: 150 }, (_, i) => `Log line ${i + 1}: debug traces and telemetry payload`).join('\n');
  const distilled = NativeEngineBridge.distillCodeModeOutput(rawSpamText, 20);
  console.log(`- Original lines: ${distilled.linesOriginal}, Retained lines: ${distilled.linesRetained}`);
  console.log(`- Raw bytes: ${distilled.rawBytes}, Distilled bytes: ${distilled.distilledBytes}`);
  console.log(`- Estimated tokens saved: ~${distilled.estimatedTokensSaved} tokens`);
  console.log(`- Execution duration: ${distilled.durationMs.toFixed(3)}ms`);

  if (distilled.linesRetained > 25 || distilled.estimatedTokensSaved === 0) {
    throw new Error('Rust distillation did not compact lines or save tokens');
  }

  // 3. Testing CodeModeService programmatic workflow
  console.log('\nPass 3: Testing CodeModeService.executeScript workflow...');
  const script = `
    const matches = await tools.search('NativeEngineBridge', false);
    const topMatches = matches.slice(0, 3);
    const firstContent = await tools.read(topMatches[0].split(':')[0], 1, 5);
    return {
      totalFound: matches.length,
      sampleFile: topMatches[0],
      firstLines: firstContent.split('\\n').slice(0, 2)
    };
  `;

  const outcome = await CodeModeService.executeScript(script, root, 'Inspect Native Bridge');
  console.log(`- Outcome success: ${outcome.success}`);
  console.log(`- Tokens saved: ~${outcome.tokensSaved}`);
  console.log(`- Duration: ${outcome.durationMs.toFixed(2)}ms`);
  console.log(`- Formatted Output:\n${outcome.output}\n`);

  if (!outcome.success || !outcome.output.includes('[⚡ Code Mode:')) {
    throw new Error('Code Mode script execution failed');
  }

  // 4. Testing ToolExecutor dispatch with code_mode_eval
  console.log('Pass 4: Testing ToolExecutor dispatch with code_mode_eval...');
  const executor = new ToolExecutor(root);
  const toolRes = await executor.execute('code_mode_eval', {
    actionName: 'Verify Version Query',
    script: `
      const matches = await tools.search('lam-agent-studio', false);
      return { status: 'ok', matchCount: matches.length };
    `
  });

  console.log(`- Tool status: ${toolRes.status}`);
  console.log(`- Execution time: ${toolRes.executionTimeMs}ms`);
  console.log(`- Tool output:\n${toolRes.result}\n`);

  if (toolRes.status !== 'success' || !toolRes.result.includes('[⚡ Code Mode: Verify Version Query')) {
    throw new Error('ToolExecutor failed to execute code_mode_eval');
  }

  console.log('🎉 ALL CODE MODE RUST INTEGRATION & VERIFICATION TESTS PASSED 100%!');
}

main().catch(err => {
  console.error('❌ Code Mode verification failed:', err);
  process.exit(1);
});
