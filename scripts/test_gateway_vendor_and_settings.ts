import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NativeGatewayWatcherBridge } from '../electron/services/NativeGatewayWatcherBridge';
import { ExternalAgentInspectorService } from '../electron/services/ExternalAgentInspectorService';
import { AgentSessionFactory } from '../electron/services/AgentSessionFactory';
import { resolveSmartModelRoute } from '../src/services/benchmark/smartModelRouter';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTests() {
  console.log('🧪 Verifying Rust SHA-256, External Agent Watcher, Model Settings Propagation & Gateway Compatibility...\n');

  // 1. Native Rust SHA-256 verification (FIPS 180-4 test vector)
  const hex = NativeGatewayWatcherBridge.sha256Hex('abc');
  assert(hex === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'Native Rust SHA-256 matches FIPS vector for "abc"');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lam-watcher-test-'));
  try {
    const sampleFile = path.join(tmpDir, 'bundle.json');
    await fs.writeFile(sampleFile, 'abc', 'utf-8');
    const fileHex = NativeGatewayWatcherBridge.sha256File(sampleFile);
    assert(fileHex === hex, 'Native Rust fastSha256File matches fastSha256Hex');

    // 2. External Agent Watcher (Synthetic Claude + Codex + Antigravity fixtures)
    const claudeProj = path.join(tmpDir, 'claude', 'projects', 'demo-repo');
    const codexSess = path.join(tmpDir, 'codex', 'sessions', '2026', '11');
    const agyConv = path.join(tmpDir, 'agy', 'conversations');
    await fs.mkdir(claudeProj, { recursive: true });
    await fs.mkdir(codexSess, { recursive: true });
    await fs.mkdir(agyConv, { recursive: true });

    await fs.writeFile(
      path.join(claudeProj, 'sess-1.jsonl'),
      [
        JSON.stringify({ type: 'user', sessionId: 'sess-1', cwd: 'D:\\repo\\api', gitBranch: 'main', entrypoint: 'claude-desktop', message: { role: 'user', content: 'Audit firewall module' } }),
        JSON.stringify({ type: 'attachment', attachment: { identity: { modelId: 'claude-opus-4-8' } } }),
        JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Bash', input: { command: 'npm run test:firewall' } }] } })
      ].join('\n')
    );

    await fs.writeFile(
      path.join(tmpDir, 'codex', 'session_index.jsonl'),
      JSON.stringify({ id: 'codex-1', thread_name: 'Refactor Gateway Controller', updated_at: '2026-11-25T04:00:00Z' }) + '\n'
    );
    await fs.writeFile(
      path.join(codexSess, 'rollout-1.jsonl'),
      [
        JSON.stringify({ type: 'session_meta', payload: { id: 'codex-1', cwd: 'D:\\repo\\gateway', originator: 'Codex Desktop' } }),
        JSON.stringify({ type: 'response_item', payload: { arguments: JSON.stringify({ cmd: 'nest build' }) } })
      ].join('\n')
    );

    await fs.writeFile(path.join(tmpDir, 'agy', 'antigravity_state.pbtxt'), 'last_selected_agent_model: gemini-3.8-flash-high\n');
    await fs.writeFile(path.join(agyConv, 'conv-123456.db'), 'sqlite-placeholder');

    const report = NativeGatewayWatcherBridge.scanExternalAgentSessions(
      path.join(tmpDir, 'claude'),
      path.join(tmpDir, 'codex'),
      path.join(tmpDir, 'agy'),
      5
    );
    assert(report.sessions.length === 3, `Scanned all 3 external providers (got ${report.sessions.length})`);
    assert(report.captured_commands.some((c) => c.command.includes('npm run test:firewall')), 'Extracted Claude Bash command into captured_commands');
    assert(report.captured_commands.some((c) => c.command.includes('nest build')), 'Extracted Codex command into captured_commands');

    // Live machine inspection smoke check
    const hostPacket = ExternalAgentInspectorService.buildFatherContextPacket(2);
    assert(hostPacket.markdown.includes('External Agent UI & CLI Activity Snapshot'), 'Father Agent context packet builds cleanly');

    // 3. Model settings propagation & multi-provider Factory checks
    const route = resolveSmartModelRoute({
      userPrompt: 'Explain this module',
      engineSettings: { provider: 'deepseek', selectedModel: 'deepseek-r1', temperature: 0.72, reasoningEffort: 'high' }
    });
    assert(route.temperature === 0.72, 'SmartModelRouter preserves user explicit temperature (0.72)');
    assert(route.reasoningEffort === 'high', 'SmartModelRouter preserves user explicit reasoningEffort ("high")');

    const dsSession = AgentSessionFactory.create({
      provider: 'deepseek',
      apiKey: 'sk-test-deepseek',
      systemInstruction: 'sys',
      turns: [{ role: 'user', text: 'hi' }],
      options: { model: 'deepseek-r1', temperature: 0.72, maxOutputTokens: 4096, reasoningEffort: 'high' }
    });
    assert(dsSession !== null && dsSession.model === 'deepseek-r1', 'AgentSessionFactory creates DeepSeek session with user model');

    const anthSession = AgentSessionFactory.create({
      provider: 'anthropic',
      apiKey: 'sk-ant-test',
      systemInstruction: 'sys',
      turns: [{ role: 'user', text: 'hi' }],
      options: { model: 'claude-3-7-sonnet', temperature: 0.3, maxOutputTokens: 16384, reasoningEffort: 'high' }
    });
    assert(anthSession !== null && anthSession.model === 'claude-3-7-sonnet', 'AgentSessionFactory creates DirectAnthropicSession');

    const gemSession = AgentSessionFactory.create({
      provider: 'gemini',
      apiKey: 'AIza-test-key',
      systemInstruction: 'sys',
      turns: [{ role: 'user', text: 'hi' }],
      options: { model: 'gemini-2.5-pro', temperature: 0.25, maxOutputTokens: 8192, reasoningEffort: 'high' }
    });
    assert(gemSession !== null && gemSession.model === 'gemini-2.5-pro', 'AgentSessionFactory creates GeminiSession with reasoningEffort & maxOutputTokens');

    console.log('\n🎉 ALL RUST/GATEWAY/SETTINGS TESTS PASSED!\n');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

void runTests();
