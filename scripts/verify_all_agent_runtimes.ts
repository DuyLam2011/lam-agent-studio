import fs from 'fs';
import path from 'path';
import { googleAccountService } from '../electron/services/GoogleAccountService';
import { codexAccountService } from '../electron/services/CodexAccountService';
import { claudeAccountService } from '../electron/services/ClaudeAccountService';
import { AntigravitySession } from '../electron/agent/providers/AntigravitySession';
import { CodexSession } from '../electron/agent/providers/CodexSession';
import { ClaudeCodeSession } from '../electron/agent/providers/ClaudeCodeSession';
import { resolveSmartModelRoute } from '../src/services/benchmark/smartModelRouter';
import { resolveSubagentModel } from '../src/services/subagents/subagentModelRouter';
import { detectConnectedPackages } from '../src/services/subagents/subagentPackageResolver';
import { detectCodeReviewIntent } from '../src/services/reviews/agentCodeReviewRouter';
import { detectSecurityAuditIntent } from '../src/services/security/agentSecurityAuditRouter';
import { findBuiltinCommand } from '../src/services/commands/agentCommandRegistry';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runMasterVerification() {
  console.log('🧪 Starting Master Agent Runtimes & Folder Pattern Verification Suite...\n');

  // 1. Google Antigravity Engine Check (Manual user login & clean boot)
  await googleAccountService.disconnect();
  const agyInitial = await googleAccountService.getStatus();
  assert(agyInitial.engine === 'antigravity', 'Antigravity engine recognized');
  assert(Array.isArray(agyInitial.models) && agyInitial.models.length >= 6, 'Loads Antigravity models');
  assert(agyInitial.connected === false, 'Google account starts clean without auto-guess');
  const agyLoginRes = await googleAccountService.login();
  assert(agyLoginRes.status.connected === true, 'Google session connected on user login');
  assert(agyLoginRes.status.email !== 'Admin@gmail.com', 'Does not use fabricated Admin email');
  const agySession = new AntigravitySession({ model: 'gemini-3.8-flash-high', turns: [] });
  assert(agySession.provider === 'antigravity', 'Antigravity session provider verified');

  // 2. OpenAI Codex (ChatGPT Plan) Check
  await codexAccountService.disconnect();
  const codexInitial = await codexAccountService.getStatus();
  assert(codexInitial.connected === false, 'Codex starts clean');
  const codexLoginRes = await codexAccountService.login();
  assert(codexLoginRes.success === true, 'Codex login connects successfully');
  const codexStatus = codexLoginRes.status;
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

  // 4. Smart Model Router Across Providers & Invariant Sanitization
  const agyRoute = resolveSmartModelRoute({ userPrompt: 'task', engineSettings: { provider: 'antigravity' } });
  const codexRoute = resolveSmartModelRoute({ userPrompt: 'task', engineSettings: { provider: 'codex' } });
  const claudeRoute = resolveSmartModelRoute({ userPrompt: 'task', engineSettings: { provider: 'claudecode' } });
  assert(agyRoute.provider === 'antigravity', 'Smart router handles antigravity');
  assert(codexRoute.provider === 'codex', 'Smart router handles codex');
  assert(claudeRoute.provider === 'claudecode', 'Smart router handles claudecode');

  // CRITICAL INVARIANT: Antigravity + gpt-6.1-sol MUST be sanitized!
  const mismatchedRoute = resolveSmartModelRoute({
    userPrompt: 'write a function',
    engineSettings: { provider: 'antigravity', selectedModel: 'gpt-6.1-sol' }
  });
  assert(mismatchedRoute.modelId !== 'gpt-6.1-sol', 'Sanitizes foreign gpt-6.1-sol model when provider is antigravity');
  assert(/^gemini|^claude|^gpt-oss/i.test(mismatchedRoute.modelId), 'Replaces with valid Antigravity engine model');

  const mismatchedSession = new AntigravitySession({ model: 'gpt-6.1-sol', reasoningEffort: '', turns: [] });
  assert(mismatchedSession.model === 'gemini-3.8-flash-high', 'AntigravitySession directly sanitizes foreign gpt-6.1-sol to gemini-3.8-flash-high');

  // 5. Dynamic Package Connection Aware Subagent Auto-Router Check
  const dummyPersona: any = { id: 'sub-test', name: 'Code Auditor', role: 'Security Specialist', model: 'auto-smart-router' };
  const agySubDecision = resolveSubagentModel(dummyPersona, 'Rà soát bảo mật OWASP', {
    provider: 'antigravity',
    googleAccount: { connected: true }
  });
  assert(agySubDecision.packageName === 'Google Antigravity', 'Subagent router identifies Google Antigravity package');
  assert(agySubDecision.packageBadge.includes('Google Antigravity'), 'Subagent router includes package badge');
  assert(agySubDecision.packageConnected === true, 'Recognizes Antigravity connection');

  const codexSubDecision = resolveSubagentModel(dummyPersona, 'Viết code frontend React', {
    provider: 'codex',
    codexAccount: { connected: true }
  });
  assert(codexSubDecision.packageName === 'OpenAI Codex', 'Subagent router identifies OpenAI Codex package');
  assert(codexSubDecision.modelId.startsWith('gpt-'), 'Codex package assigns gpt model');

  // 6. Dedicated Code Review Class & Router Invariants
  const branchReviewIntent = detectCodeReviewIntent('Please review changes on main against origin/main');
  assert(branchReviewIntent.isReview === true, 'Detects review intent for "Please review changes on main against origin/main"');
  assert(branchReviewIntent.targetRef === 'origin/main', 'Extracts targetRef "origin/main" from branch review prompt');
  assert(branchReviewIntent.recommendedSubagentId.includes('reviewer'), 'Routes review task to review class subagent');

  const vnReviewIntent = detectCodeReviewIntent('nhờ bạn soát lỗi và review code giúp tôi');
  assert(vnReviewIntent.isReview === true, 'Detects Vietnamese review intent');

  const nonReviewIntent = detectCodeReviewIntent('viết hàm tính tổng hai số nguyên');
  assert(nonReviewIntent.isReview === false, 'Non-review task does not trigger review mode');

  // 7. Dedicated Security & Penetration Testing Mode Invariants
  const pentestIntent = detectSecurityAuditIntent('/pentest check OWASP vulnerabilities');
  assert(pentestIntent.isSecurityAudit === true, 'Detects penetration testing intent');
  assert(pentestIntent.recommendedSubagentId === 'subagent-security-harness', 'Routes pentest to Security Sentinel subagent');

  const vnPentestIntent = detectSecurityAuditIntent('quét lỗ hổng bảo mật và rò rỉ token');
  assert(vnPentestIntent.isSecurityAudit === true, 'Detects Vietnamese security audit intent');

  // 8. Built-in Agent Command Registry Invariants (No /caveman or /delegate text commands; pure UI controls)
  const cavemanCmd = findBuiltinCommand('/caveman on');
  assert(cavemanCmd.commandDef === undefined, 'No text /caveman command (managed strictly via ChatToneSelector UI)');

  const delegateCmd = findBuiltinCommand('/delegate task');
  assert(delegateCmd.commandDef === undefined, 'No text /delegate command (managed strictly via UI Flow & natural delegation)');

  const reviewCmd = findBuiltinCommand('/review against origin/main');
  assert(reviewCmd.commandDef?.id === 'cmd-review', 'Resolves /review command');
  assert(reviewCmd.args === 'against origin/main', 'Extracts targetRef argument from /review');

  const pentestCmd = findBuiltinCommand('/security-audit full');
  assert(pentestCmd.commandDef?.id === 'cmd-pentest', 'Resolves /security-audit alias to cmd-pentest');

  const commitCmd = findBuiltinCommand('/commit');
  assert(commitCmd.commandDef?.id === 'cmd-commit', 'Resolves /commit command');

  const helpCmd = findBuiltinCommand('/help');
  assert(helpCmd.commandDef?.id === 'cmd-help', 'Resolves /help command');

  // 9. Rule 4 Compliance (<= 150 lines per file)
  const auditedFiles = [
    'electron/services/GoogleAccountService.ts',
    'electron/services/CodexAccountService.ts',
    'electron/services/ClaudeAccountService.ts',
    'electron/services/SandboxExecutionService.ts',
    'electron/services/GitReviewContextService.ts',
    'electron/services/RulesSkillsWatcherService.ts',
    'electron/agent/providers/AntigravitySession.ts',
    'electron/agent/providers/GeminiSession.ts',
    'electron/agent/providers/CodexSession.ts',
    'electron/agent/providers/ClaudeCodeSession.ts',
    'electron/services/AgentEngine.ts',
    'electron/agent/types.ts',
    'src/services/subagents/subagentModelRouter.ts',
    'src/services/subagents/subagentPackageResolver.ts',
    'src/services/lead-agent/leadDelegationOrchestrator.ts',
    'src/services/lead-agent/leadDelegationPlanner.ts',
    'src/services/reviews/agentSubagentReviewService.ts',
    'src/services/reviews/agentCodeReviewRouter.ts',
    'src/services/reviews/agentDedicatedReviewWorkflow.ts',
    'src/services/security/agentSecurityAuditRouter.ts',
    'src/services/security/agentDedicatedSecurityWorkflow.ts',
    'src/services/commands/agentCommandRegistry.ts',
    'src/services/commands/agentCommandDispatcher.ts',
    'src/services/agent-chat/agentRunStreamer.ts',
    'src/services/agent-chat/agentRunService.ts',
    'src/components/modals/agents-center/ConnectedPackagesBar.tsx',
    'src/components/modals/agents-center/SubagentCard.tsx',
    'src/components/modals/agents-center/SubagentsTab.tsx',
    'src/components/modals/agents-center/AgentFormFields.tsx',
    'src/components/modals/agents-center/SubagentBadges.tsx',
    'src/components/modals/AccountCenterModal.tsx',
    'src/components/modals/account/GoogleAccountCard.tsx',
    'src/components/modals/account/CodexAccountCard.tsx',
    'src/components/modals/account/ClaudeAccountCard.tsx',
    'src/components/modals/account/GitHubAccountCard.tsx',
    'src/components/agent/AgentModelDropdown.tsx',
    'src/components/agent/AgentHeader.tsx',
    'src/components/agent/context/ChatInputActionBar.tsx',
    'src/components/agent/context/ChatToneSelector.tsx',
    'src/components/agent/message/AgentRunTimeline.tsx',
    'src/components/agent/message/ThinkingAccordion.tsx',
    'src/components/agent/message/TasksAccordion.tsx',
    'src/components/agent/message/FatherAgentControlBar.tsx',
    'src/components/agent/ChatMessageItem.tsx',
    'src/components/agent/modelConstants.ts',
    'src/components/agent/ChatTopAlerts.tsx',
    'src/services/benchmark/smartModelRouter.ts',
    'src/components/core/WindowControls.tsx',
    'src/components/modals/setting-center/tabs/AiEngineSettingsTab.tsx',
    'src/components/modals/setting-center/tabs/FileSandboxTab.tsx',
    'src/components/modals/setting-center/tabs/SandboxRunnerSection.tsx',
    'src/components/agent/context/ChatReasoningEffortSelector.tsx',
    'src/types/ai-architect.ts',
    'src/services/architect/aiArchitectClarificationService.ts',
    'src/components/modals/agents-center/architect/WorkspaceAndDiffSelector.tsx',
    'src/components/modals/agents-center/architect/GrillMeInterviewPanel.tsx',
    'src/components/modals/agents-center/AiRuleGeneratorModal.tsx',
    'src/components/modals/agents-center/AiRuleGeneratorBody.tsx',
    'src/components/modals/agents-center/AiSkillConsultantModal.tsx',
    'src/components/modals/agents-center/AiSkillConsultantBody.tsx',
    'src/components/agent/combo/AgentComboCard.tsx',
    'src/components/agent/combo/AgentComboPill.tsx',
    'src/components/agent/combo/AgentComboSelectorModal.tsx',
    'src/components/agent/combo/ComboEnsemblePills.tsx',
    'src/components/agent/combo/ComboFlowSelector.tsx',
    'src/components/agent/combo/ComboPipelineStepList.tsx',
    'src/components/agent/combo/ComboSubagentPicker.tsx',
    'src/components/agent/combo/ComboQuickDropdown.tsx',
    'src/components/agent/combo/CreateComboModal.tsx',
    'src/components/modals/agents-center/CombosTab.tsx'
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
