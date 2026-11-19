import assert from 'assert';
import { resolveSubagentModel } from '../src/services/subagents/subagentModelRouter';
import { cleanShellCmd, resolveToolHeadline } from '../src/components/agent/tool-call/toolCallHeadline';
import { sanitizeAgyModel } from '../electron/agent/providers/AntigravitySession';
import { standardBuiltinSubagents } from '../src/data/defaultSubagents';

console.log('🧪 Starting Verification: Model Routing, Tool Clarity & Antigravity Session...');

// Test 1: Subagent defaults are auto-smart-router and have no gemini-3.5-flash-lite
for (const sub of standardBuiltinSubagents) {
  assert.ok(!sub.model?.includes('gemini-3.5'), `Subagent ${sub.id} must not have gemini-3.5 model`);
  assert.ok(sub.model === 'auto-smart-router' || sub.model === 'auto' || !sub.model, `Subagent ${sub.id} should default to auto`);
}
console.log('✅ Pass 1: Subagent catalog cleanly configured with auto-smart-router');

// Test 2: When user provider is Codex, routing MUST return Codex models, NOT Gemini
const plannerSub = standardBuiltinSubagents.find((s) => s.id === 'subagent-task-planner') || standardBuiltinSubagents[0];
const codexEngine = { provider: 'codex', hardworkLevel: 'deep', codexAccount: { connected: true } };
const codexDecision = resolveSubagentModel(plannerSub, 'Analyze requirements & architectural contracts', codexEngine);

console.log('Codex Decision:', {
  provider: codexDecision.provider,
  packageName: codexDecision.packageName,
  modelId: codexDecision.modelId,
  modelName: codexDecision.modelName
});
assert.strictEqual(codexDecision.provider, 'codex');
assert.strictEqual(codexDecision.packageName, 'OpenAI Codex');
assert.ok(codexDecision.modelId === 'gpt-4o' || codexDecision.modelId === 'o3-mini' || codexDecision.modelId === 'gpt-4o-mini');
assert.ok(!codexDecision.modelId.includes('gemini'), 'Codex provider MUST NOT route to Gemini');
console.log('✅ Pass 2: Codex routing correctly assigns OpenAI models');

// Test 3: When user provider is Antigravity, routing MUST return valid agy.exe models
const agyEngine = { provider: 'antigravity', hardworkLevel: 'deep', googleAccount: { connected: true } };
const agyDecision = resolveSubagentModel(plannerSub, 'Analyze requirements', agyEngine);
console.log('Antigravity Decision:', {
  provider: agyDecision.provider,
  packageName: agyDecision.packageName,
  modelId: agyDecision.modelId
});
assert.strictEqual(agyDecision.provider, 'antigravity');
assert.ok(agyDecision.modelId.startsWith('gemini-3.8-') || agyDecision.modelId.startsWith('claude-'));
console.log('✅ Pass 3: Antigravity routing correctly assigns supported CLI models');

// Test 4: sanitizeAgyModel produces valid models for agy.exe
assert.strictEqual(sanitizeAgyModel('gemini-2.5-pro'), 'gemini-3.8-flash-high');
assert.strictEqual(sanitizeAgyModel('gemini-2.5-flash'), 'gemini-3.8-flash-medium');
assert.strictEqual(sanitizeAgyModel('claude-3-7-sonnet'), 'claude-sonnet-4-6');
assert.strictEqual(sanitizeAgyModel('claude-opus'), 'claude-opus-4-6-thinking');
assert.strictEqual(sanitizeAgyModel('gemini-3.8-flash-high'), 'gemini-3.8-flash-high');
console.log('✅ Pass 4: sanitizeAgyModel cleanly maps incoming models to agy CLI catalog');

// Test 5: Tool Headline cleanShellCmd extracts real command from Git Bash wrapper
const rawBash = '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c "git status"';
assert.strictEqual(cleanShellCmd(rawBash), 'git status');

const rawCmd2 = '& "C:\\Program Files\\Git\\bin\\bash.exe" -l -c "npm test -- --coverage"';
assert.strictEqual(cleanShellCmd(rawCmd2), 'npm test -- --coverage');

const hCmd = resolveToolHeadline('run_command', { CommandLine: rawBash });
assert.strictEqual(hCmd.action, 'Command');
assert.strictEqual(hCmd.target, 'git status');

const hFile = resolveToolHeadline('file_change', { Path: 'src/lib/notion-subscribers.ts' });
assert.strictEqual(hFile.action, 'Patch File');
assert.strictEqual(hFile.target, 'notion-subscribers.ts');

const hWrite = resolveToolHeadline('write_file', { Path: 'package.json' });
assert.strictEqual(hFile.action, 'Patch File');
assert.strictEqual(hWrite.target, 'package.json');
console.log('✅ Pass 5: Tool headlines extract clean command names and filenames instead of generic placeholders');

console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
