import {
  resolveModelFamily,
  getModelCommandRule,
  detectCommandRisk,
  MODEL_COMMAND_RULESET
} from '../src/services/command-settings/modelCommandRuleset';
import {
  resolveEffectiveCommandDir,
  getFolderCommandSetting,
  setWorkspaceCommandFolder
} from '../src/services/command-settings/commandFolderSettingsManager';
import { adviseCommand } from '../src/services/command-settings/commandAdvisorService';
import {
  loadCommandExecutionPolicy,
  updateCommandExecutionPolicy,
  resetCommandExecutionPolicy
} from '../src/services/command-settings/commandSettingsService';
import * as fs from 'fs';
import * as path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(name: string, condition: boolean, extra?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name}${extra ? ` (${extra})` : ''}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}${extra ? ` (${extra})` : ''}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('🧪 L.A.M AGENT STUDIO: COMMAND SETTINGS & MODEL RULESET SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST CASE 1: Model Family Resolution
// -----------------------------------------------------------------------------
console.log('🔹 Test Case 1: Model Family Resolution');
assert('Resolves claude-3-5-sonnet to claude', resolveModelFamily('claude-3-5-sonnet') === 'claude');
assert('Resolves gemini-2.0-flash to gemini', resolveModelFamily('gemini-2.0-flash') === 'gemini');
assert('Resolves gpt-4o-mini to openai', resolveModelFamily('gpt-4o-mini') === 'openai');
assert('Resolves deepseek-coder to local-ollama', resolveModelFamily('deepseek-coder-v2') === 'local-ollama');
assert('Resolves qwen2.5 to local-ollama', resolveModelFamily('qwen2.5-coder') === 'local-ollama');
assert('Defaults empty string to claude', resolveModelFamily('') === 'claude');

// -----------------------------------------------------------------------------
// TEST CASE 2: Model Command Ruleset Invariants
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 2: Model Command Ruleset Invariants');
const claudeRule = getModelCommandRule('claude');
assert('Claude allows pipeline-multistep', claudeRule.chainingStyle === 'pipeline-multistep');
assert('Claude output limit is 150 lines', claudeRule.maxOutputLines === 150);

const geminiRule = getModelCommandRule('gemini');
assert('Gemini requires pipeOutputLimit', geminiRule.pipeOutputLimit === true);
assert('Gemini output limit is 100 lines', geminiRule.maxOutputLines === 100);

const ollamaRule = getModelCommandRule('local-ollama');
assert('Ollama enforces atomic-single chaining', ollamaRule.chainingStyle === 'atomic-single');
assert('Ollama max lines capped to 50', ollamaRule.maxOutputLines === 50);

// -----------------------------------------------------------------------------
// TEST CASE 3: Command Intent Tailoring & Non-Interactive Flags
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 3: Command Intent Tailoring & Non-Interactive Flags');
const advTest = adviseCommand({ userIntent: 'chạy test', modelFamily: 'claude' });
assert('Tailors "chạy test" to npm test', advTest.recommendedCommand === 'npm test');

const advType = adviseCommand({ userIntent: 'typecheck', modelFamily: 'gemini' });
assert('Tailors "typecheck" to npx --yes tsc --noEmit with output cap', advType.recommendedCommand.includes('npx --yes tsc --noEmit'));

const advNpx = adviseCommand({ userIntent: 'npx eslint src/', modelFamily: 'claude' });
assert('Injects --yes flag for npx commands', advNpx.recommendedCommand.includes('npx --yes eslint src/'));

// -----------------------------------------------------------------------------
// TEST CASE 4: Model-Specific Output Truncation
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 4: Model-Specific Output Truncation');
const advOllama = adviseCommand({ userIntent: 'git status', modelFamily: 'local-ollama' });
assert('Ollama command appends pipe head limit', advOllama.recommendedCommand.includes('| head -n 35'));

const advClaude = adviseCommand({ userIntent: 'git status --short', modelFamily: 'claude' });
assert('Claude command does not force head pipe', !advClaude.recommendedCommand.includes('| head -n'));

// -----------------------------------------------------------------------------
// TEST CASE 5: Destructive Commands & Safeguard Confirmation Gate
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 5: Destructive Commands & Safeguard Confirmation Gate');
const riskCritical = detectCommandRisk('rm -rf /var/data');
assert('Detects critical risk for rm -rf', riskCritical.riskTier === 'critical');
assert('Requires safeguard for critical deletion', riskCritical.requiresSafeguard === true);

const riskHardReset = detectCommandRisk('git reset --hard HEAD~2');
assert('Detects high risk for git reset --hard', riskHardReset.riskTier === 'high');
assert('Requires safeguard for git reset --hard', riskHardReset.requiresSafeguard === true);

const riskSafe = detectCommandRisk('git status --short');
assert('Safe command has low risk', riskSafe.riskTier === 'low');
assert('Safe command does not require safeguard', riskSafe.requiresSafeguard === false);

// -----------------------------------------------------------------------------
// TEST CASE 6: Command Working Directory Resolution & Persistence
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 6: Command Working Directory Resolution & Persistence');
const testRepo = 'd:/projects/my-app';
const dirRoot = resolveEffectiveCommandDir('ws-1', testRepo, '.');
assert('Resolves root folder correctly', dirRoot === 'd:/projects/my-app');

setWorkspaceCommandFolder('ws-1', testRepo, 'apps/frontend');
const dirCustom = resolveEffectiveCommandDir('ws-1', testRepo);
assert('Resolves configured default subfolder', dirCustom.includes('apps/frontend'));

const dirExplicit = resolveEffectiveCommandDir('ws-1', testRepo, 'packages/core');
assert('Explicit subfolder takes precedence', dirExplicit.includes('packages/core'));

// -----------------------------------------------------------------------------
// TEST CASE 7: Command Execution Policy Management
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 7: Command Execution Policy Management');
const initPolicy = loadCommandExecutionPolicy();
assert('Default policy has safeguard enabled', initPolicy.safeguardConfirmationRequired === true);

const updatedPolicy = updateCommandExecutionPolicy({ outputLineLimit: 120 });
assert('Policy updates successfully', updatedPolicy.outputLineLimit === 120);

const resetPolicy = resetCommandExecutionPolicy();
assert('Policy resets to default (100 lines)', resetPolicy.outputLineLimit === 100);

// -----------------------------------------------------------------------------
// TEST CASE 8: Rule 4 Compliance Audit (<= 150 Lines per File)
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 8: Rule 4 Compliance Audit (<= 150 Lines per File)');
const filesToCheck = [
  'src/types/command-settings.ts',
  'src/services/command-settings/modelCommandRuleset.ts',
  'src/services/command-settings/commandFolderSettingsManager.ts',
  'src/services/command-settings/commandAdvisorService.ts',
  'src/services/command-settings/commandSettingsService.ts',
  'src/components/modals/setting-center/tabs/CommandSettingsTab.tsx',
  'src/components/modals/setting-center/SettingCenterModal.tsx'
];

let allUnder150 = true;
for (const relPath of filesToCheck) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  const isOk = lineCount <= 150;
  if (!isOk) allUnder150 = false;
  assert(`File ${relPath} complies with Rule 4`, isOk, `${lineCount}/150 lines`);
}
assert('All Command Settings files strictly <= 150 lines', allUnder150);

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('🎉 ALL COMMAND SETTINGS & MODEL RULESET TEST CASES PASSED SUCCESSFULLY!');
} else {
  console.error('⚠️ SOME TESTS FAILED.');
}
console.log('================================================================');
