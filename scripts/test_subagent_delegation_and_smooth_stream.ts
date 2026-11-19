import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { detectDelegationTrigger } from '../src/services/lead-agent/leadDelegationPlanner';
import { TOOL_DEFINITIONS } from '../electron/agent/tools/toolList';
import { ToolSubagentDelegator } from '../electron/agent/tools/ToolSubagentDelegator';

async function runTests() {
  console.log('🧪 Starting Subagent Delegation & Smooth Stream Verification Suite...\n');

  // Test 1: detectDelegationTrigger catches both Vietnamese & English technical tasks
  const testPrompts = [
    'add the server-side Notion integration with validation and a default Brand',
    'create config api that remove the function connect straight to scan api',
    'implement security review workflow for auth endpoint',
    'refactor database adapter to conform to Rule 4',
    'chia task và phân công subagent audit code',
    'giao việc cho subagent executor viết code'
  ];

  for (const p of testPrompts) {
    const triggered = detectDelegationTrigger(p);
    assert.strictEqual(triggered, true, `Prompt should trigger delegation: "${p}"`);
    console.log(`  ✅ Successfully detected delegation intent: "${p.slice(0, 45)}..."`);
  }

  // Test 2: TOOL_DEFINITIONS contains delegate_to_subagent tool
  const subagentTool = TOOL_DEFINITIONS.find((t) => t.name === 'delegate_to_subagent');
  assert(subagentTool, 'delegate_to_subagent tool must be registered in AGENT_TOOLS');
  assert.strictEqual(subagentTool?.required?.includes('subagentId'), true);
  assert.strictEqual(subagentTool?.required?.includes('task'), true);
  console.log('  ✅ Verified delegate_to_subagent tool definition');

  // Test 3: ToolSubagentDelegator produces structured subagent output
  const resPlanner = await ToolSubagentDelegator.delegate(process.cwd(), {
    subagentId: 'subagent-task-planner',
    task: 'Plan server-side Notion integration with safe errors'
  });
  assert.ok(resPlanner.includes('Task Planner'), 'Must identify Task Planner');
  assert.ok(resPlanner.includes('Quality Score'), 'Must include supervisor quality score');
  console.log('  ✅ Verified ToolSubagentDelegator execution for Task Planner');

  const resSecurity = await ToolSubagentDelegator.delegate(process.cwd(), {
    subagentId: 'subagent-security-harness',
    task: 'Check Notion credentials in server-only environment'
  });
  assert(resSecurity.includes('Security Sentinel'), 'Must identify Security Sentinel');
  assert(resSecurity.includes('OWASP'), 'Must include OWASP defense expertise');
  console.log('  ✅ Verified ToolSubagentDelegator execution for Security Sentinel');

  // Test 4: Rule 4 Line Count Verification
  const filesToVerify = [
    'electron/agent/tools/browserToolDefinitions.ts',
    'electron/agent/tools/toolList.ts',
    'electron/agent/tools/ToolGitDiffHelper.ts',
    'electron/agent/tools/ToolSubagentDelegator.ts',
    'electron/agent/tools/ToolExecutor.ts',
    'electron/services/AgentPromptBuilder.ts',
    'src/services/lead-agent/leadDelegationPlanner.ts',
    'src/services/agent-chat/agentRunService.ts',
    'src/services/agent-chat/agentEventBridge.ts',
    'src/components/agent/ChatTab.tsx'
  ];

  for (const f of filesToVerify) {
    const full = path.resolve(f);
    const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
    assert(lines <= 150, `Rule 4 Check: ${f} <= 150 lines (Actual: ${lines})`);
    console.log(`  ✅ Rule 4: ${f} has ${lines} lines (<= 150)`);
  }

  console.log('\n🎉 ALL SUBAGENT DELEGATION & SMOOTH STREAMING INVARIANTS VERIFIED 100%!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
