import { decomposeTaskWithRuleset } from '../src/services/lead-agent/leadDelegationPlanner';
import { standardBuiltinSubagents } from '../src/data/defaultSubagents';
import { INTELLIGENCE_TIER_CONFIGS, COST_BALANCE_CONFIGS } from '../src/services/agent-profile/agentProfileDefaults';
import { evaluateSubagentOutputQuality } from '../src/services/subagents/subagentSupervisorEngine';
import { HardworkLevel } from '../src/store/useAgentStore';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

export async function runEffortAndIntelligenceBenchmark() {
  console.log('⚡ Starting Effort Coding, Intelligence Tier & Speed Benchmark Suite...\n');

  const taskGoal = 'Implement production OAuth2 PKCE login with secure token storage and unit tests';
  const subagents = standardBuiltinSubagents;

  // 1. Benchmark: Subagent Allocation & Swarm Scaling across Hardwork Levels
  const levels: HardworkLevel[] = ['rapid', 'balanced', 'deep', 'max_swarm'];
  const plans = levels.map((lvl) => ({
    level: lvl,
    plan: decomposeTaskWithRuleset(taskGoal, subagents, { hardworkLevel: lvl, provider: 'antigravity' })
  }));

  const rapidPlan = plans.find((p) => p.level === 'rapid')!.plan;
  const balancedPlan = plans.find((p) => p.level === 'balanced')!.plan;
  const deepPlan = plans.find((p) => p.level === 'deep')!.plan;
  const maxSwarmPlan = plans.find((p) => p.level === 'max_swarm')!.plan;

  console.log('📊 Subagent Scaling by Effort Level:');
  console.log(`  - Rapid:      ${rapidPlan.contracts.length} agent  (Velocity First)`);
  console.log(`  - Balanced:   ${balancedPlan.contracts.length} agents (Pair Engineering)`);
  console.log(`  - Deep:       ${deepPlan.contracts.length} agents (3-Stage Pipeline)`);
  console.log(`  - Max Swarm:  ${maxSwarmPlan.contracts.length} agents (Full 5-Agent Team)`);

  assert(rapidPlan.contracts.length === 1, 'Rapid mode uses exactly 1 subagent for maximum velocity');
  assert(rapidPlan.contracts[0].subagentId === 'subagent-code-executor', 'Rapid mode directly executes with code executor');

  assert(balancedPlan.contracts.length === 2, 'Balanced mode uses 2 subagents (Executor + Architecture Reviewer)');
  assert(balancedPlan.contracts.some((c) => c.subagentId.includes('reviewer')), 'Balanced mode includes automated code review');

  assert(deepPlan.contracts.length === 3, 'Deep mode uses 3 subagents (Planner + Executor + Reviewer)');
  assert(deepPlan.contracts[0].subagentId === 'subagent-task-planner', 'Deep mode begins with milestone decomposition');

  assert(maxSwarmPlan.contracts.length === 5, 'Max Swarm mode mobilizes all 5 specialized subagents');
  assert(maxSwarmPlan.contracts.some((c) => c.subagentId.includes('security')), 'Max Swarm includes dedicated OWASP security sentinel');
  assert(maxSwarmPlan.contracts.some((c) => c.subagentId.includes('qa')), 'Max Swarm includes dedicated QA verification specialist');

  // Verify monotonic scale invariant: Rapid < Balanced < Deep < Max Swarm
  assert(
    rapidPlan.contracts.length < balancedPlan.contracts.length &&
    balancedPlan.contracts.length < deepPlan.contracts.length &&
    deepPlan.contracts.length < maxSwarmPlan.contracts.length,
    'Contract counts strictly follow scaling: Rapid (1) < Balanced (2) < Deep (3) < Max Swarm (5)'
  );

  // 2. Benchmark: Intelligence Tier & Speed Presets
  const flashTier = INTELLIGENCE_TIER_CONFIGS['flash-fast'];
  const standardTier = INTELLIGENCE_TIER_CONFIGS['standard'];
  const advancedTier = INTELLIGENCE_TIER_CONFIGS['advanced'];
  const frontierTier = INTELLIGENCE_TIER_CONFIGS['frontier-pro'];

  assert(flashTier.recommendedCostBalance === 'cost-optimized', 'Flash Fast recommends cost-optimized preset');
  assert(flashTier.defaultModel.includes('flash'), 'Flash Fast assigns ultra-high-velocity flash model');

  assert(frontierTier.recommendedCostBalance === 'frontier-intelligence', 'Frontier Pro recommends max intelligence preset');
  assert(/sonnet|pro|gpt-6/i.test(frontierTier.defaultModel), 'Frontier Pro assigns frontier intelligence reasoning model');

  // 3. Benchmark: Cost Balance & Token Multipliers
  const budgetMultiplier = parseFloat(COST_BALANCE_CONFIGS['cost-optimized'].tokenMultiplier);
  const balancedMultiplier = parseFloat(COST_BALANCE_CONFIGS['balanced'].tokenMultiplier);
  const highThroughputMultiplier = parseFloat(COST_BALANCE_CONFIGS['high-throughput'].tokenMultiplier);
  const maxIntelMultiplier = parseFloat(COST_BALANCE_CONFIGS['frontier-intelligence'].tokenMultiplier);

  console.log('\n💰 Token Budget Multipliers:');
  console.log(`  - Budget Saver:      ${budgetMultiplier}x`);
  console.log(`  - Standard Balanced: ${balancedMultiplier}x`);
  console.log(`  - High Throughput:   ${highThroughputMultiplier}x`);
  console.log(`  - Max Intelligence:  ${maxIntelMultiplier}x`);

  assert(budgetMultiplier === 0.2, 'Budget Saver multiplier is 0.2x (-80% token overhead)');
  assert(balancedMultiplier === 1.0, 'Standard Balanced multiplier is 1.0x');
  assert(highThroughputMultiplier === 1.8, 'High Throughput multiplier is 1.8x');
  assert(maxIntelMultiplier === 3.0, 'Max Intelligence multiplier is 3.0x for deep reasoning');
  assert(
    budgetMultiplier < balancedMultiplier && balancedMultiplier < highThroughputMultiplier && highThroughputMultiplier < maxIntelMultiplier,
    'Token multipliers scale monotonically across cost & intelligence tiers'
  );

  // 4. Benchmark: Supervisor Quality Scoring across Output Thoroughness
  const lowQualitySample = 'Done. I wrote the code and it looks okay.';
  const lowEval = evaluateSubagentOutputQuality(lowQualitySample);
  assert(lowEval.isAdequate === false, 'Rejects superficial output without citations or verdict');
  assert(lowEval.score < 60, 'Superficial output receives low supervisor quality score');

  const highQualitySample = `### Code Audit Report
- Target: src/services/authService.ts (Line 42)
- Security: Implemented PKCE code_challenge with SHA-256 to prevent auth interception.
- Rule 4 Compliance: 94 lines total (<= 150 lines/file limit respected).
VERDICT: PASS`;
  const highEval = evaluateSubagentOutputQuality(highQualitySample);
  assert(highEval.isAdequate === true, 'Accepts comprehensive output with citations, file lines and verdict');
  assert(highEval.score >= 80, 'Thorough analytical output achieves high supervisor score (>=80)');

  // 5. Invariant: Rule 4 Compliance across all dispatched contracts
  for (const c of maxSwarmPlan.contracts) {
    if (c.subagentId === 'subagent-code-executor') {
      assert(c.taskObjective.includes('<150 lines'), 'Code executor contract explicitly enforces Rule 4 (<150 lines)');
    }
  }

  console.log('\n🎉 ALL EFFORT CODING & INTELLIGENCE BENCHMARK INVARIANTS VERIFIED 100%!');
}

if (process.argv[1] && process.argv[1].endsWith('test_effort_and_intelligence_benchmark.ts')) {
  runEffortAndIntelligenceBenchmark().catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });
}
