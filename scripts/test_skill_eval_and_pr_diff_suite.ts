import { analyzeSkillModificationDiff } from '../src/services/skills/skillDiffAnalyzer';
import { runSkillEvaluationSuite, compareSkillEvaluations, evaluateTestCase } from '../src/services/skills/skillEvalRunner';
import { buildSkillPrReviewMarkdown } from '../src/services/skills/skillPrReviewBuilder';
import { DEFAULT_SKILL_EVAL_SUITES } from '../src/data/skills/defaultSkillEvals';
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
console.log('🧪 L.A.M AGENT STUDIO: SKILL EVALUATION & PR DIFF TEST SUITE');
console.log('================================================================\n');

const VALID_BASE_SKILL = `---
name: code_review_guard
description: Review code diffs with extreme precision. Trigger on "review code", "audit pr", "/review".
---
# Code Review Guard
## Instructions
Always verify strict TypeScript type safety and Rule 4 decompose <150 lines.
## Verification
Always verify clean compile with npx tsc --noEmit.
## Safety Constraints
Never remove existing comments or bypass permission checks.
`;

console.log('🔹 Test Case 1: PR Diff Analysis - Trigger Drift Detection');
const PR_TRIGGER_DRIFT = `---
name: code_review_guard
description: Just a generic reviewer tool for internal files.
---
# Code Review Guard
## Instructions
Review files carefully.
## Verification
Run tests.
## Safety Constraints
None.
`;
const diffResult1 = analyzeSkillModificationDiff(VALID_BASE_SKILL, PR_TRIGGER_DRIFT, 'code_review_guard');
assert('Detects trigger_drift anomaly', diffResult1.anomalies.some(a => a.type === 'trigger_drift'));
assert('Verdict is BLOCKED due to broken trigger invariant', diffResult1.verdict === 'BLOCKED');
assert('isMergeSafe is false', diffResult1.isMergeSafe === false);

console.log('\n🔹 Test Case 2: PR Diff Analysis - Safety Guardrails Dropped');
const PR_SAFETY_DROPPED = `---
name: code_review_guard
description: Review code diffs. Trigger on "review code".
---
# Code Review Guard
## Instructions
Review files fast.
## Verification
Verify compile.
`;
const diffResult2 = analyzeSkillModificationDiff(VALID_BASE_SKILL, PR_SAFETY_DROPPED, 'code_review_guard');
assert('Detects safety_dropped anomaly', diffResult2.anomalies.some(a => a.type === 'safety_dropped'));
assert('Verdict is BLOCKED due to dropped safety constraints', diffResult2.verdict === 'BLOCKED');

console.log('\n🔹 Test Case 3: PR Diff Analysis - Verification Step Dropped');
const PR_VERIFY_DROPPED = `---
name: code_review_guard
description: Review code diffs. Trigger on "review code".
---
# Code Review Guard
## Instructions
Review files.
## Safety Constraints
Never bypass safety rules.
`;
const diffResult3 = analyzeSkillModificationDiff(VALID_BASE_SKILL, PR_VERIFY_DROPPED, 'code_review_guard');
assert('Detects verification_dropped anomaly', diffResult3.anomalies.some(a => a.type === 'verification_dropped'));
assert('Verdict requires changes', diffResult3.verdict === 'REQUIRES_CHANGES');

console.log('\n🔹 Test Case 4: PR Diff Analysis - Token Bloat Warning');
const bloatedContent = VALID_BASE_SKILL + '\n' + new Array(600).fill('excessive_fluff_word').join(' ');
const diffResult4 = analyzeSkillModificationDiff(VALID_BASE_SKILL, bloatedContent, 'code_review_guard');
assert('Detects token_bloat anomaly', diffResult4.anomalies.some(a => a.type === 'token_bloat'));
assert('Records positive word count delta > 500', diffResult4.wordCountDelta >= 500);

console.log('\n🔹 Test Case 5: PR Diff Analysis - Approved Clean Modification');
const PR_CLEAN_OPTIMIZATION = `---
name: code_review_guard
description: Surgical code review & OWASP guard. Trigger on "review code", "audit pr", "/review", or "check diff".
---
# Code Review Guard (Optimized)
## Instructions
Always verify strict TypeScript type safety, zero regression, and Rule 4 modularization <150 lines per module.
## Verification
Verify with npx tsc --noEmit and unit test assertions.
## Safety Constraints
Never delete existing logic or bypass sandbox boundaries.
`;
const diffResult5 = analyzeSkillModificationDiff(VALID_BASE_SKILL, PR_CLEAN_OPTIMIZATION, 'code_review_guard');
assert('No breaking anomalies found', diffResult5.anomalies.filter(a => a.severity === 'breaking').length === 0);
assert('Verdict is APPROVED', diffResult5.verdict === 'APPROVED');
assert('isMergeSafe is true', diffResult5.isMergeSafe === true);

console.log('\n🔹 Test Case 6: Eval File Execution - 100% Pass Rate on Default Suite');
const crSuite = DEFAULT_SKILL_EVAL_SUITES['code_review_guard'];
assert('code_review_guard eval suite is defined', Boolean(crSuite));
assert('Suite has at least 3 test cases', crSuite.testCases.length >= 3);

const evalReportPass = runSkillEvaluationSuite(crSuite, PR_CLEAN_OPTIMIZATION);
assert('Eval pass rate is 100%', evalReportPass.passRate === 100, `${evalReportPass.passedCount}/${evalReportPass.totalTests} passed`);
assert('Average score is 100', evalReportPass.averageScore === 100);
assert('Total tokens consumed is tracked', evalReportPass.totalTokens > 0, `${evalReportPass.totalTokens} tokens`);

console.log('\n🔹 Test Case 7: Eval File Execution - Negative Assertion Failure');
const failingTestCase = {
  id: 'tc-negative-01',
  name: 'No Placeholders Constraint',
  description: 'Must fail if output contains // TODO',
  userPrompt: 'Implement review',
  expectedBehavior: {
    mustInclude: ['verify'],
    mustNotInclude: ['// TODO', 'placeholder']
  }
};
const failingContent = 'Here is the output: // TODO: fix this later. Please verify.';
const evalResultFail = evaluateTestCase(failingTestCase, failingContent, 50);
assert('Correctly fails when mustNotInclude keyword is present', evalResultFail.passed === false);
assert('Failure reason identifies forbidden token', evalResultFail.failureReason?.includes('// TODO') === true);
assert('Score is penalized', evalResultFail.score < 100);

console.log('\n🔹 Test Case 8: Eval Suite Comparison & Regression Detection');
const mockReportV1 = {
  suiteId: 'suite-1',
  skillId: 'code_review_guard',
  timestamp: 1000,
  totalTests: 2,
  passedCount: 2,
  failedCount: 0,
  passRate: 100,
  averageScore: 100,
  totalTokens: 250,
  status: 'passed' as const,
  results: [
    { testCaseId: 'tc-01', name: 'T1', passed: true, score: 100, tokensConsumed: 120 },
    { testCaseId: 'tc-02', name: 'T2', passed: true, score: 100, tokensConsumed: 130 }
  ]
};
const mockReportV2 = {
  suiteId: 'suite-1',
  skillId: 'code_review_guard',
  timestamp: 2000,
  totalTests: 2,
  passedCount: 1,
  failedCount: 1,
  passRate: 50,
  averageScore: 50,
  totalTokens: 240,
  status: 'failed' as const,
  results: [
    { testCaseId: 'tc-01', name: 'T1', passed: true, score: 100, tokensConsumed: 120 },
    { testCaseId: 'tc-02', name: 'T2', passed: false, score: 0, failureReason: 'Invariant missing', tokensConsumed: 120 }
  ]
};
const comparison = compareSkillEvaluations(mockReportV1, mockReportV2);
assert('Detects regression correctly', comparison.hasRegressions === true);
assert('Identifies regressed test cases', comparison.regressedTestCases.includes('tc-02'));
assert('Delta pass rate is -50%', comparison.passRateDelta === -50);

console.log('\n🔹 Test Case 9: Executive-First PR Review Markdown Generation');
const prMarkdown = buildSkillPrReviewMarkdown(diffResult5, evalReportPass);
assert('Markdown includes Approved banner', prMarkdown.includes('[APPROVED - MERGE SAFE]'));
assert('Markdown includes Scope & Diff Metrics', prMarkdown.includes('### 📑 Tổng Quan Thay Đổi'));
assert('Markdown includes Invariants & Safety Scan', prMarkdown.includes('### 🔍 Kiểm Định Bất Biến & An Toàn'));
assert('Markdown includes Eval Suite Table', prMarkdown.includes('### 🧪 Kết Quả Chạy Eval Test Suite'));
assert('Markdown includes test case rows', prMarkdown.includes('tc-cr-01'));

console.log('\n🔹 Test Case 10: Rule 4 Compliance Audit (<= 150 Lines per File)');
const filesToCheck = [
  'src/types/skill-eval.ts',
  'src/data/skills/defaultSkillEvals.ts',
  'src/services/skills/skillDiffAnalyzer.ts',
  'src/services/skills/skillEvalRunner.ts',
  'src/services/skills/skillPrReviewBuilder.ts',
  'src/components/modals/agents-center/skills/SkillEvalDrawer.tsx',
  'src/components/modals/agents-center/skills/SkillPrDiffModal.tsx',
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
assert('All Skill Eval & PR Diff files strictly <= 150 lines', allUnder150);

console.log('\n================================================================');
console.log(`🏁 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('🎉 ALL SKILL EVAL & PR DIFF TEST CASES PASSED SUCCESSFULLY!');
}
console.log('================================================================');
