import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { FileSecurityHarness } from '../electron/services/FileSecurityHarness.ts';
import { SurgicalPatchEngine } from '../electron/services/SurgicalPatchEngine.ts';
import { agentEngine } from '../electron/services/AgentEngine.ts';

const TEST_DIR = path.resolve(process.cwd(), 'sandbox_test_workspace');

async function runTests() {
  console.log('🧪 [1/4] Starting FileSecurityHarness Unit Tests...');
  const inside = FileSecurityHarness.validatePath(TEST_DIR, 'src/index.ts', 'read', 'guarded');
  assert.strictEqual(inside.allowed, true);

  const traversal = FileSecurityHarness.validatePath(TEST_DIR, '../../Windows/System32', 'read', 'guarded');
  assert.strictEqual(traversal.allowed, false);

  const envWrite = FileSecurityHarness.validatePath(TEST_DIR, '.env', 'write', 'guarded');
  assert.strictEqual(envWrite.allowed, false);

  const restrictedWrite = FileSecurityHarness.validatePath(TEST_DIR, 'src/app.ts', 'write', 'restricted');
  assert.strictEqual(restrictedWrite.allowed, false);

  const dangerousCmd = FileSecurityHarness.checkCommandPermission('rm -rf /', 'turbo');
  assert.strictEqual(dangerousCmd.allowed, false);
  console.log('✅ FileSecurityHarness tests passed!');

  console.log('🧪 [2/4] Starting SurgicalPatchEngine Unit Tests...');
  const sampleCRLF = 'line 1\r\nline 2\r\nline 3\r\n';
  const resCRLF = SurgicalPatchEngine.applySurgicalEdit(sampleCRLF, 'line 2', 'line 2 MODIFIED');
  assert.ok(resCRLF.updatedContent.includes('line 2 MODIFIED'));
  assert.ok(resCRLF.updatedContent.includes('\r\n'));

  const sampleTrailing = 'function test()   \n  return true;   \n';
  const resTrail = SurgicalPatchEngine.applySurgicalEdit(sampleTrailing, 'function test()\n  return true;', 'function test()\n  return false;');
  assert.strictEqual(resTrail.matchType, 'normalized-whitespace');

  const multiLine = Array.from({ length: 30 }, (_, i) => `const val_${i + 1} = ${i + 1};`).join('\n');
  const windowed = SurgicalPatchEngine.formatWindowedContent(multiLine, 10, 15);
  assert.ok(windowed.includes('10 | const val_10 = 10;'));
  assert.ok(windowed.includes('15 | const val_15 = 15;'));
  console.log('✅ SurgicalPatchEngine tests passed!');

  console.log('🧪 [3/4] Testing AgentEngine.executeTool End-to-End...');
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
  agentEngine.setWorkspaceRoot(TEST_DIR);

  // 1. Tool write_file
  const writeRes = await agentEngine.executeTool('write_file', { path: 'agent_test.ts', content: 'export const status = "idle";\n' }, 'guarded');
  assert.strictEqual(writeRes.status, 'success');

  // 2. Tool read_file (windowed)
  const readRes = await agentEngine.executeTool('read_file', { path: 'agent_test.ts', startLine: 1, endLine: 1 }, 'guarded');
  assert.strictEqual(readRes.status, 'success');
  assert.ok(readRes.result.includes('1 | export const status = "idle";'));

  // 3. Tool edit_file (surgical patch)
  const editRes = await agentEngine.executeTool('edit_file', { path: 'agent_test.ts', targetContent: '"idle"', replacementContent: '"active"' }, 'guarded');
  assert.strictEqual(editRes.status, 'success');

  // 4. Verify Diff Snapshot tracked in AgentEngine
  const diffs = agentEngine.getDiffSnapshots();
  assert.ok(diffs.length >= 2, 'Diff snapshots must be recorded');

  // 5. Tool security: blocked path traversal
  const escapeRes = await agentEngine.executeTool('write_file', { path: '../../evil.txt', content: 'hack' }, 'turbo');
  assert.strictEqual(escapeRes.status, 'failed');
  assert.ok(escapeRes.result.includes('SANDBOX VIOLATION'));

  // 6. Tool security: blocked write in restricted mode
  const restrictRes = await agentEngine.executeTool('write_file', { path: 'agent_test.ts', content: 'blocked' }, 'restricted');
  assert.strictEqual(restrictRes.status, 'failed');

  // 7. Tool js / node_repl high-speed batch execution
  const jsRes = await agentEngine.executeTool('js', {
    code: `
      var fs = await import('node:fs/promises');
      var path = await import('node:path');
      nodeRepl.write({ status: 'ready', engine: 'node_repl' });
    `
  }, 'guarded');
  assert.strictEqual(jsRes.status, 'success');
  assert.strictEqual(jsRes.result.status, 'ready');
  assert.strictEqual(jsRes.result.engine, 'node_repl');
  assert.ok(jsRes.executionTimeMs < 1000);

  // Clean up
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  console.log('✅ AgentEngine.executeTool E2E tests passed!');

  console.log('🎉 [4/4] ALL AGENT CODING, PERMISSION & TOOL TESTS PASSED (100% SUCCESS)!');
}

runTests();
