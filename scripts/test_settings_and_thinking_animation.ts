import assert from 'assert';
import { evaluateSubagentOutputQuality } from '../src/services/subagents/subagentSupervisorEngine';

console.log('🧪 Starting Settings Center & Agent Loop Optimization Tests...');

// Test 1: Subagent Quality Evaluation for Planner / Executor (No longer demands PASS/CHANGES_REQUIRED)
const plannerOutput = `### 📋 Strategic Task Plan
We will inspect src/lib/notion-subscribers.ts and add validation routines.
- Step 1: Create schema validation for subscriber payload.
- Step 2: Implement saveSubscriber() function and integrate Notion API client.
- Step 3: Run npm test to verify unit tests.`;

const evalPlanner = evaluateSubagentOutputQuality(plannerOutput, 'strategic-task-planner');
console.log('Test 1 - Planner evaluation score:', evalPlanner.score, 'isAdequate:', evalPlanner.isAdequate);
assert.strictEqual(evalPlanner.isAdequate, true, 'Planner subagent output with actionable steps must pass quality gate');
assert.ok(evalPlanner.score >= 60, 'Planner score must be >= 60');

// Test 2: Subagent Quality Evaluation for Reviewer (Still requires verdict)
const reviewerWithoutVerdict = `Checked file src/lib/notion-subscribers.ts. Found 3 functions and 2 imports.`;
const evalReviewerNoVerdict = evaluateSubagentOutputQuality(reviewerWithoutVerdict, 'subagent-eval-engineer');
console.log('Test 2 - Reviewer without verdict isAdequate:', evalReviewerNoVerdict.isAdequate);
assert.strictEqual(evalReviewerNoVerdict.isAdequate, false, 'Reviewer without verdict must fail quality gate');

const reviewerWithVerdict = `### 🛡️ Code Review
Inspected src/lib/notion-subscribers.ts lines 10-40.
VERDICT: PASS.
All parameters are sanitized and credentials are kept in environment variables.`;
const evalReviewerWithVerdict = evaluateSubagentOutputQuality(reviewerWithVerdict, 'subagent-eval-engineer');
console.log('Test 2b - Reviewer with verdict isAdequate:', evalReviewerWithVerdict.isAdequate);
assert.strictEqual(evalReviewerWithVerdict.isAdequate, true, 'Reviewer with verdict must pass quality gate');

// Test 3: Brief output failure
const briefOutput = 'Done.';
const evalBrief = evaluateSubagentOutputQuality(briefOutput, 'strategic-task-planner');
assert.strictEqual(evalBrief.isAdequate, false, 'Brief output must fail quality gate');

// Test 4: Scope filter logic verification for active: false on repo / workspace items
interface TestScopeItem {
  id: string;
  scope: 'global' | 'workspace' | 'repo';
  targetId?: string;
  active: boolean;
  disabledIn?: string[];
}

const mockRules: TestScopeItem[] = [
  { id: 'rule-global', scope: 'global', active: true },
  { id: 'rule-ws-active', scope: 'workspace', targetId: 'ws-1', active: true },
  { id: 'rule-ws-disabled', scope: 'workspace', targetId: 'ws-1', active: false },
  { id: 'rule-repo-active', scope: 'repo', targetId: 'd:/repo', active: true },
  { id: 'rule-repo-disabled', scope: 'repo', targetId: 'd:/repo', active: false },
];

const getActiveItems = (items: TestScopeItem[], wsId?: string, repoPath?: string) => {
  return items.filter((item) => {
    if (item.scope === 'global') {
      if (!item.active) return false;
      if (wsId && item.disabledIn?.includes(wsId)) return false;
      return true;
    }
    if (item.scope === 'workspace') return wsId ? (item.targetId === wsId && item.active !== false) : false;
    if (item.scope === 'repo') return repoPath ? (item.targetId === repoPath && item.active !== false) : false;
    return false;
  });
};

const activeInWs1 = getActiveItems(mockRules, 'ws-1', 'd:/repo');
console.log('Test 4 - Active items in ws-1 and d:/repo:', activeInWs1.map(i => i.id));
assert.ok(activeInWs1.some(i => i.id === 'rule-ws-active'), 'rule-ws-active must be included');
assert.ok(!activeInWs1.some(i => i.id === 'rule-ws-disabled'), 'rule-ws-disabled must be excluded when active: false');
assert.ok(activeInWs1.some(i => i.id === 'rule-repo-active'), 'rule-repo-active must be included');
assert.ok(!activeInWs1.some(i => i.id === 'rule-repo-disabled'), 'rule-repo-disabled must be excluded when active: false');

console.log('✅ All Settings, Switches, and Subagent Loop Optimization Tests Passed Successfully!');
