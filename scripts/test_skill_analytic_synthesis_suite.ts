import { scanTargetRepoContext, synthesizeSkillWithAnalyticAgent } from '../src/services/skills/skillAnalyticSynthesizer';
import { runSkillEvaluationSuite } from '../src/services/skills/skillEvalRunner';
import { AGENT_CLASS_REGISTRY } from '../src/types/agent-class';
import { resolveAgentClassForTask } from '../src/services/agent-classes/agentClassRouter';
import { standardBuiltinSubagents } from '../src/data/defaultSubagents';
import { AnalyticSkillDraftRequest } from '../src/types/skill-analytic';
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
console.log('🧪 L.A.M AGENT STUDIO: SKILL CREATION & ANALYTIC AGENT SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST CASE 1: Repo Context Scanning
// -----------------------------------------------------------------------------
console.log('🔹 Test Case 1: Repo Context Scanning');
const repoIntel = scanTargetRepoContext('d:/Documents/github.com/lam-agent-studio', 'lam-agent-studio');
assert('Identifies repo name correctly', repoIntel.repoName === 'lam-agent-studio');
assert('Detects TypeScript ecosystem', repoIntel.hasTypeScript === true);
assert('Detects core frameworks', repoIntel.frameworks.includes('Electron') && repoIntel.frameworks.includes('React'));
assert('Identifies modularity pattern', repoIntel.detectedPatterns.some(p => p.includes('150 lines')));

// -----------------------------------------------------------------------------
// TEST CASE 2: 3-Section Workspace & Objective Ingestion
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 2: 3-Section Workspace & Objective Ingestion');
const draftRequest: AnalyticSkillDraftRequest = {
  workspaceId: 'ws-prod-01',
  workspaceName: 'Production Core',
  targetRepoPath: 'd:/Documents/github.com/FirewallRuleTool_Jobs',
  targetRepoName: 'FirewallRuleTool_Jobs',
  contextTag: '(Production Core:FirewallRuleTool_Jobs)',
  projectWorkDirection: 'Refactoring firewall rule synchronization pipeline to zero-trust architecture with atomic batch transactions.',
  desiredSkillObjectives: 'Audit firewall JSON schema payloads, validate CIDR ranges, and generate deterministic rollbacks.',
  qualityInvariants: 'Rule 4 decompose <150 lines, verify via npx tsc --noEmit, never mutate production firewall without user prompt.'
};

const synthesisResult = synthesizeSkillWithAnalyticAgent(draftRequest);
assert('Generated valid folder name', Boolean(synthesisResult.suggestedFolderName));
assert('Generated skill includes context tag in markdown', synthesisResult.generatedSkillContent.includes('(Production Core:FirewallRuleTool_Jobs)'));
assert('Generated skill includes project work direction', synthesisResult.generatedSkillContent.includes('zero-trust architecture'));
assert('Generated skill includes quality invariants', synthesisResult.generatedSkillContent.includes('Rule 4'));

// -----------------------------------------------------------------------------
// TEST CASE 3: Analytic Subagent Synthesis (100% English Output)
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 3: Analytic Subagent Synthesis (100% English Output)');
const cap = synthesisResult.capabilityAnalysis;
assert('Primary role is formulated in English', cap.primaryRole.includes('Specialized domain automation'));
assert('Supported triggers include slash command & folder', cap.supportedTriggers.some(t => t.includes('/')));
assert('Key responsibilities breakdown has >= 3 items', cap.keyResponsibilities.length >= 3);
assert('Toolchain includes standard surgical tools', cap.orchestratedTools.includes('read_file') && cap.orchestratedTools.includes('edit_file'));
assert('Safety boundaries enforce user constraints & Rule 4', cap.safetyBoundaries.some(s => s.includes('150 lines')));
assert('Expected deliverables specify zero regression & verification', cap.expectedOutputs.some(o => o.includes('zero regression') || o.includes('compile')));
assert('Summary markdown has Executive-First format', cap.summaryMarkdown.includes('### 🧠 Skill Capability Breakdown'));

// -----------------------------------------------------------------------------
// TEST CASE 4: Automatic Eval Suite Generation
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 4: Automatic Eval Suite Generation');
const evalSuite = synthesisResult.generatedEvalSuite;
assert('Eval suite matches skill folder ID', evalSuite.skillId === synthesisResult.suggestedFolderName);
assert('Eval suite has at least 2 test cases', evalSuite.testCases.length >= 2);

const tc1 = evalSuite.testCases[0];
assert('TC1 includes mustInclude assertions', (tc1.expectedBehavior.mustInclude?.length || 0) > 0);
assert('TC1 includes mustNotInclude assertions', tc1.expectedBehavior.mustNotInclude?.includes('// TODO') === true);
assert('TC1 defines token budget', (tc1.expectedBehavior.maxTokens || 0) > 0);

const tc2 = evalSuite.testCases[1];
assert('TC2 validates safety boundaries', tc2.name.includes('Safety') || tc2.expectedBehavior.mustInclude?.includes('safety'));

// -----------------------------------------------------------------------------
// TEST CASE 5: Live Execution of Synthesized Eval Suite
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 5: Live Execution of Synthesized Eval Suite');
const evalRunResult = runSkillEvaluationSuite(evalSuite, synthesisResult.generatedSkillContent);
assert('Synthesized skill passes its own generated eval suite', evalRunResult.passRate === 100, `${evalRunResult.passedCount}/${evalRunResult.totalTests} passed`);
assert('Average score is 100', evalRunResult.averageScore === 100);
assert('Token budget tracked cleanly', evalRunResult.totalTokens > 0, `${evalRunResult.totalTokens} tokens`);

// -----------------------------------------------------------------------------
// TEST CASE 6: Subagent Class Analytic Registration & Routing
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 6: Subagent Class Analytic Registration & Routing');
assert('Analytic class is registered in AGENT_CLASS_REGISTRY', Boolean(AGENT_CLASS_REGISTRY.analytic));
assert('Analytic class theme color is defined', AGENT_CLASS_REGISTRY.analytic.themeColor === '#06b6d4');
assert('Analytic class badge label is ANALYTIC', AGENT_CLASS_REGISTRY.analytic.badgeLabel === 'ANALYTIC');

const resolvedClass = resolveAgentClassForTask('quét repo và phân tích capabilities của skill bằng eval suite');
assert('Router resolves analytical tasks to analytic class', resolvedClass === 'analytic');

const analyticSubs = standardBuiltinSubagents.filter(s => s.agentClass === 'analytic');
assert('Built-in subagents include analytic agents', analyticSubs.length >= 2);
assert('Includes subagent-repo-analyst', analyticSubs.some(s => s.id === 'subagent-repo-analyst'));
assert('Includes subagent-eval-engineer', analyticSubs.some(s => s.id === 'subagent-eval-engineer'));

// -----------------------------------------------------------------------------
// TEST CASE 7: Rule 4 Compliance Audit (<= 150 Lines per File)
// -----------------------------------------------------------------------------
console.log('\n🔹 Test Case 7: Rule 4 Compliance Audit (<= 150 Lines per File)');
const filesToCheck = [
  'src/types/skill-analytic.ts',
  'src/services/skills/skillAnalyticSynthesizer.ts',
  'src/services/skills/skillCapabilityAnalyzer.ts',
  'src/data/subagents/analyticSubagents.ts',
  'src/components/modals/agents-center/skills/SkillCapabilityBreakdownCard.tsx',
  'src/components/modals/agents-center/skills/SkillEvalSuitePreviewCard.tsx',
  'src/components/modals/agents-center/skills/SkillAnalyticArchitectView.tsx',
  'src/components/modals/agents-center/skills/SkillStudioModal.tsx',
  'src/components/modals/agents-center/skills/useSkillStudioState.ts'
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
assert('All Skill Analytic files strictly <= 150 lines', allUnder150);

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('🎉 ALL SKILL CREATION & ANALYTIC AGENT TEST CASES PASSED SUCCESSFULLY!');
} else {
  console.error('⚠️ SOME TESTS FAILED.');
}
console.log('================================================================');
