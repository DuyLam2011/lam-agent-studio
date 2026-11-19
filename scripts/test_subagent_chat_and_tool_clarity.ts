import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { resolveToolHeadline } from '../src/components/agent/tool-call/toolCallHeadline';
import { inferPackageMeta } from '../src/services/subagents/subagentPackageResolver';
import { resolveSubagentModel } from '../src/services/subagents/subagentModelRouter';
import { AGENT_VISUAL_REGISTRY } from '../src/types/avatar';
import { googleAccountService } from '../electron/services/GoogleAccountService';

async function runTests() {
  console.log('🧪 Starting Subagent Chat Presence & Tool Clarity Test Suite...\n');

  // Test 1: Unwrapping wrapped commands in resolveToolHeadline
  const psWrapped = '"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "bash -lc \'npm install @notionhq/client\'"';
  const h1 = resolveToolHeadline('command_execution', { command: psWrapped });
  assert.strictEqual(h1.action, 'Command');
  assert.strictEqual(h1.target, 'npm install @notionhq/client');
  console.log('  ✅ Verified unwrapping of PowerShell + bash -lc wrapped command');

  // Test 2: Powershell simple command unwrapping
  const psSimple = 'powershell.exe -Command "ls package.json"';
  const h2 = resolveToolHeadline('run_command', { command: psSimple });
  assert.strictEqual(h2.action, 'Command');
  assert.strictEqual(h2.target, 'ls package.json');
  console.log('  ✅ Verified unwrapping of PowerShell -Command wrapper');

  // Test 3: Model family takes precedence over default provider in inferPackageMeta
  const metaGeminiOnCodex = inferPackageMeta('gemini-2.5-flash', 'codex');
  assert.strictEqual(metaGeminiOnCodex.id, 'gemini', 'gemini-2.5-flash must be mapped to gemini provider, not codex');
  console.log('  ✅ Verified gemini model cannot be misrouted to codex binary');

  const metaGptOnGemini = inferPackageMeta('gpt-4o', 'gemini');
  assert.strictEqual(metaGptOnGemini.id, 'codex', 'gpt-4o must be mapped to codex provider');
  console.log('  ✅ Verified gpt model is correctly mapped to codex provider');

  // Test 4: Subagent router falls back safely to active connected package
  const dummySubagent = {
    id: 'subagent-task-planner',
    name: 'Strategic Task Planner',
    role: 'Planner',
    systemPrompt: '',
    model: 'gemini-2.5-flash',
    agentClass: 'planner' as const
  };
  const decision = resolveSubagentModel(dummySubagent, 'Decompose feature integration', {
    provider: 'codex',
    codexAccount: { connected: true }
  });
  assert(decision.provider === 'codex', 'Provider must fall back to active connected codex provider');
  assert(decision.modelId.startsWith('gpt-') || decision.modelId.startsWith('o'), 'Model must adapt to valid codex model instead of failing gemini model');
  console.log(`  ✅ Verified subagent router adapts to active codex provider with model: ${decision.modelId}`);

  // Test 5: Avatar visual registry contains all specialized subagent roles
  assert('subagent-repo-analyst' in AGENT_VISUAL_REGISTRY);
  assert('subagent-eval-engineer' in AGENT_VISUAL_REGISTRY);
  assert('subagent-task-planner' in AGENT_VISUAL_REGISTRY);
  assert('subagent-code-executor' in AGENT_VISUAL_REGISTRY);
  assert('subagent-backend-reviewer' in AGENT_VISUAL_REGISTRY);
  console.log('  ✅ Verified all subagents are registered in AGENT_VISUAL_REGISTRY');

  // Test 6: GoogleAccountService binary candidate resolution
  const binPath = googleAccountService.getBinaryPath();
  assert(typeof binPath === 'string' && binPath.length > 0);
  console.log(`  ✅ Verified Antigravity binary path resolution: ${binPath}`);

  // Test 7: Rule 4 Line Count Verification (<= 150 lines)
  const files = [
    'src/services/subagents/subagentPackageResolver.ts',
    'src/services/subagents/subagentModelRouter.ts',
    'src/types/avatar.ts',
    'src/components/agent/ChatMessageItem.tsx',
    'src/services/lead-agent/leadDelegationOrchestrator.ts',
    'src/components/agent/tool-call/toolCallHeadline.ts',
    'src/components/agent/ToolCallCard.tsx',
    'src/components/agent/message/TasksAccordion.tsx',
    'src/components/agent/message/MarkdownMessageBody.tsx',
    'electron/agent/loop/runAgentLoop.ts',
    'src/services/agent-chat/agentEventReducer.ts',
    'electron/agent/providers/CodexSession.ts',
    'electron/agent/providers/AntigravitySession.ts',
    'electron/services/GoogleAccountService.ts'
  ];

  for (const f of files) {
    const full = path.resolve(f);
    const count = fs.readFileSync(full, 'utf-8').split('\n').length;
    assert(count <= 150, `File ${f} must be <= 150 lines (Actual: ${count})`);
    console.log(`  ✅ Rule 4: ${f} -> ${count} lines (<= 150)`);
  }

  console.log('\n🎉 ALL SUBAGENT CHAT PRESENCE & TOOL CLARITY INVARIANTS VERIFIED 100%!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
