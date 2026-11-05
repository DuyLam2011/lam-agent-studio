import fs from 'fs';
import path from 'path';
import { googleAccountService } from '../electron/services/GoogleAccountService';
import { codexAccountService } from '../electron/services/CodexAccountService';
import { claudeAccountService } from '../electron/services/ClaudeAccountService';
import { AntigravitySession } from '../electron/agent/providers/AntigravitySession';
import { CodexSession } from '../electron/agent/providers/CodexSession';
import { ClaudeCodeSession } from '../electron/agent/providers/ClaudeCodeSession';
import { resolveSmartModelRoute } from '../src/services/benchmark/smartModelRouter';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runMasterVerification() {
  console.log('🧪 Starting Master Agent Runtimes & Folder Pattern Verification Suite...\n');

  // 1. Google Antigravity Engine Check
  const agyStatus = await googleAccountService.getStatus();
  console.log('ℹ️ Antigravity Status:', { connected: agyStatus.connected, models: agyStatus.models.length });
  assert(agyStatus.engine === 'antigravity', 'Antigravity engine recognized');
  assert(agyStatus.connected === true, 'Google Antigravity session connected');
  const agySession = new AntigravitySession({ model: 'gemini-3.8-flash-high', turns: [] });
  assert(agySession.provider === 'antigravity', 'Antigravity session provider verified');

  // 2. OpenAI Codex (ChatGPT Plan) Check
  const codexStatus = await codexAccountService.getStatus();
  console.log('ℹ️ Codex Status:', { connected: codexStatus.connected, plan: codexStatus.planType, models: codexStatus.models.length });
  assert(codexStatus.engine === 'codex', 'Codex engine recognized');
  assert(codexStatus.connected === true, 'Codex session connected via ChatGPT');
  assert(codexStatus.authMode === 'chatgpt', 'Codex uses official ChatGPT auth');
  const codexSession = new CodexSession({ model: 'gpt-6.1-sol', turns: [] });
  assert(codexSession.provider === 'codex', 'Codex session provider verified');

  // 3. Claude Code (Official Runtime) Check
  const claudeStatus = await claudeAccountService.getStatus();
  console.log('ℹ️ Claude Code Status:', { connected: claudeStatus.connected, sub: claudeStatus.subscriptionType, compliant: claudeStatus.complianceCompliant });
  assert(claudeStatus.engine === 'claudecode', 'Claude Code engine recognized');
  assert(claudeStatus.connected === true, 'Claude Code official session detected');
  assert(claudeStatus.complianceCompliant === true, 'Adheres to Anthropic unmodified CLI compliance');
  const claudeSession = new ClaudeCodeSession({ model: 'claude-3-7-sonnet', turns: [] });
  assert(claudeSession.provider === 'claudecode', 'Claude Code session provider verified');

  // 4. Smart Model Router Across Providers
  const agyRoute = resolveSmartModelRoute({ userPrompt: 'task', engineSettings: { provider: 'antigravity' } });
  const codexRoute = resolveSmartModelRoute({ userPrompt: 'task', engineSettings: { provider: 'codex' } });
  const claudeRoute = resolveSmartModelRoute({ userPrompt: 'task', engineSettings: { provider: 'claudecode' } });
  assert(agyRoute.provider === 'antigravity', 'Smart router handles antigravity');
  assert(codexRoute.provider === 'codex', 'Smart router handles codex');
  assert(claudeRoute.provider === 'claudecode', 'Smart router handles claudecode');

  // 5. Rule 4 Compliance (<= 150 lines per file)
  const auditedFiles = [
    'electron/services/GoogleAccountService.ts',
    'electron/services/CodexAccountService.ts',
    'electron/services/ClaudeAccountService.ts',
    'electron/agent/providers/AntigravitySession.ts',
    'electron/agent/providers/CodexSession.ts',
    'electron/agent/providers/ClaudeCodeSession.ts',
    'electron/services/AgentEngine.ts',
    'electron/agent/types.ts',
    'src/components/modals/AccountCenterModal.tsx',
    'src/components/modals/account/GoogleAccountCard.tsx',
    'src/components/modals/account/CodexAccountCard.tsx',
    'src/components/modals/account/ClaudeAccountCard.tsx',
    'src/components/modals/account/GitHubAccountCard.tsx',
    'src/components/agent/AgentModelDropdown.tsx',
    'src/components/agent/modelConstants.ts',
    'src/components/agent/ChatTopAlerts.tsx',
    'src/services/benchmark/smartModelRouter.ts'
  ];

  for (const f of auditedFiles) {
    const full = path.resolve(f);
    if (fs.existsSync(full)) {
      const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
      assert(lines <= 150, `Rule 4 Check: ${f} <= 150 lines (Actual: ${lines})`);
    }
  }

  console.log('\n🎉 ALL TRIPLE-ENGINE & ARCHITECTURAL INVARIANTS VERIFIED 100%!');
}

runMasterVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
