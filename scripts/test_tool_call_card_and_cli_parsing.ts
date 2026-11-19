import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { resolveToolHeadline } from '../src/components/agent/tool-call/toolCallHeadline';

async function runTests() {
  console.log('🧪 Starting Tool Execution Card & CLI Tool Parser Suite...\n');

  // Test 1: resolveToolHeadline maps raw CLI command_execution to clean "Command" headline
  const h1 = resolveToolHeadline('command_execution', { command: 'npm install @notionhq/client' });
  assert.strictEqual(h1.action, 'Command');
  assert.strictEqual(h1.target, 'npm install @notionhq/client');
  console.log('  ✅ Verified headline mapping for command_execution with command');

  // Test 2: resolveToolHeadline handles fallback when command is empty
  const h2 = resolveToolHeadline('command_execution', {});
  assert.strictEqual(h2.action, 'Command');
  assert.strictEqual(h2.target, 'Terminal Command');
  console.log('  ✅ Verified headline fallback for empty command_execution');

  // Test 3: resolveToolHeadline maps file_change to Patch File / Write File
  const h3 = resolveToolHeadline('file_change', { path: 'src/lib/notion-subscribers.ts' });
  assert.strictEqual(h3.action, 'Patch File');
  assert.strictEqual(h3.target, 'notion-subscribers.ts');
  console.log('  ✅ Verified headline mapping for file_change');

  // Test 4: resolveToolHeadline maps run_command
  const h4 = resolveToolHeadline('run_command', { command: 'git status -s' });
  assert.strictEqual(h4.action, 'Command');
  assert.strictEqual(h4.target, 'git status -s');
  console.log('  ✅ Verified headline mapping for standard run_command');

  // Test 5: resolveToolHeadline maps delegate_to_subagent
  const h5 = resolveToolHeadline('delegate_to_subagent', { subagentId: 'subagent-security-harness' });
  assert.strictEqual(h5.action, 'Delegate');
  assert.strictEqual(h5.target, 'subagent-security-harness');
  console.log('  ✅ Verified headline mapping for delegate_to_subagent');

  // Test 6: Rule 4 Line Count Verification
  const filesToVerify = [
    'src/components/agent/tool-call/toolCallHeadline.ts',
    'src/components/agent/ToolCallCard.tsx',
    'electron/agent/providers/CodexSession.ts',
    'electron/agent/providers/ClaudeCodeSession.ts'
  ];

  for (const f of filesToVerify) {
    const full = path.resolve(f);
    const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
    assert(lines <= 150, `Rule 4 Check: ${f} <= 150 lines (Actual: ${lines})`);
    console.log(`  ✅ Rule 4: ${f} has ${lines} lines (<= 150)`);
  }

  console.log('\n🎉 ALL TOOL EXECUTION CARD & CLI PARSING INVARIANTS VERIFIED 100%!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
