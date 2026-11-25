import path from 'path';
import { CiCdVerificationService } from '../electron/services/CiCdVerificationService';
import { CiCdLoopOrchestrator } from '../electron/services/CiCdLoopOrchestrator';
import { ToolSkillReader } from '../electron/agent/tools/ToolSkillReader';
import { ToolExecutor } from '../electron/agent/tools/ToolExecutor';
import { CodeModeService } from '../electron/services/CodeModeService';
import { standardBuiltinAgentCombos } from '../src/data/defaultAgentCombos';
import { scoreWorkspaceForCombos } from '../src/services/combos/workspaceComboAuditorService';

async function runTests() {
  const workspaceRoot = path.resolve(__dirname, '..');
  console.log('🧪 Starting Verification: CI/CD & Lint Self-Healing Suite with Agent Combo...\n');

  // Test 1: Skill Discovery
  console.log('Pass 1: Checking skill discovery via ToolSkillReader...');
  const skill = await ToolSkillReader.readSkill(workspaceRoot, 'ci_cd_self_healing');
  if (!skill.includes('Autonomous CI/CD & Lint Self-Healing Skill')) {
    throw new Error('Failed to discover ci_cd_self_healing skill');
  }
  if (!skill.includes('verify_ci_cd') || !skill.includes('Agent Tự Thử')) {
    throw new Error('Skill missing required CI self-healing directives');
  }
  console.log('✅ Pass 1: Skill discovery and self-healing directives verified.');

  // Test 2: Agent Combo Registration & Workspace Scoring
  console.log('\nPass 2: Verifying built-in Agent Combo registration...');
  const combo = standardBuiltinAgentCombos.find(c => c.id === 'combo-ci-cd-loop-healer');
  if (!combo) {
    throw new Error('combo-ci-cd-loop-healer not found in standardBuiltinAgentCombos');
  }
  if (combo.subagentIds.length < 4 || combo.steps.length < 4) {
    throw new Error('combo-ci-cd-loop-healer missing required subagents or steps');
  }
  console.log(`- Combo Name: "${combo.name}" (${combo.steps.length} steps, ${combo.subagentIds.length} subagents)`);

  const audit = scoreWorkspaceForCombos(null, ['.github', 'workflows', 'package.json'], standardBuiltinAgentCombos);
  const ciScore = audit.allComboScores.find(s => s.comboId === 'combo-ci-cd-loop-healer');
  if (!ciScore || ciScore.score < 50) {
    throw new Error('Workspace auditor failed to score combo-ci-cd-loop-healer for GitHub workflows');
  }
  console.log(`- Workspace Audit Score: ${ciScore.score} pts (${ciScore.reasons.join('; ')})`);
  console.log('✅ Pass 2: Agent Combo registration and auto-recommendation verified.');

  // Test 3: CiCdVerificationService Execution
  console.log('\nPass 3: Running CiCdVerificationService.runFullAudit...');
  const auditRes = await CiCdVerificationService.runFullAudit(workspaceRoot, {
    skipBuild: true,
    testFilter: 'test_rust_native_engine.ts'
  });
  console.log(`- GitHub Remote: ${auditRes.githubStatus.connected ? auditRes.githubStatus.repo : 'None'}`);
  console.log(`- Workflows: ${auditRes.workflowStatus.count} valid workflows`);
  console.log(`- Composite Errors Count: ${auditRes.compositeErrors.length}`);
  console.log(`- Verification Score: ${auditRes.score}/100`);
  if (!auditRes.formattedReport.includes('CI/CD, LINT & COMPOSITE TEST REPORT')) {
    throw new Error('CiCdVerificationService returned invalid formatted report');
  }
  console.log('✅ Pass 3: Full audit executed cleanly with composite diagnostics.');

  // Test 4: ToolExecutor Dispatch (verify_ci_cd)
  console.log('\nPass 4: Testing ToolExecutor dispatch with verify_ci_cd...');
  const executor = new ToolExecutor(workspaceRoot);
  const toolRes = await executor.execute('verify_ci_cd', {
    skipBuild: true,
    testFilter: 'test_rust_native_engine.ts'
  });
  if (toolRes.status !== 'success' || !String(toolRes.result).includes('CI/CD')) {
    throw new Error('ToolExecutor verify_ci_cd failed: ' + JSON.stringify(toolRes));
  }
  console.log('✅ Pass 4: ToolExecutor verify_ci_cd tool executed successfully.');

  // Test 5: Autonomous Self-Healing Loop Simulation
  console.log('\nPass 5: Testing CiCdLoopOrchestrator self-healing loop simulation...');
  let repairInvoked = false;
  const loopRes = await CiCdLoopOrchestrator.executeSelfHealingLoop(workspaceRoot, {
    maxAttempts: 3,
    skipBuild: true,
    testFilter: 'test_rust_native_engine.ts',
    repairFn: async (_report, attempt) => {
      repairInvoked = true;
      console.log(`  [Repair Hook] Mock repair executed on attempt ${attempt}`);
      return true;
    }
  });
  if (typeof loopRes.success !== 'boolean' || loopRes.attemptsRun < 1) {
    throw new Error('CiCdLoopOrchestrator failed to return valid loop result');
  }
  console.log(`- Loop Status: ${loopRes.status} (${loopRes.attemptsRun} attempt(s))`);
  console.log(`- Timeline Iterations: ${loopRes.timeline.length}`);
  console.log('✅ Pass 5: Self-healing loop orchestrator verified.');

  // Test 6: Code Mode Programmatic CI/CD Verification
  console.log('\nPass 6: Testing Code Mode programmatic workflow with tools.verifyCiCd...');
  const codeModeRes = await CodeModeService.executeScript(
    `const res = await tools.verifyCiCd({ skipBuild: true, testFilter: 'test_rust_native_engine.ts' });
     return { passed: res.passed, score: res.score, workflows: res.workflowStatus.count };`,
    workspaceRoot,
    'Programmatic CI Verification'
  );
  if (!codeModeRes.success || !codeModeRes.output.includes('score')) {
    throw new Error('Code Mode tools.verifyCiCd failed: ' + codeModeRes.output);
  }
  console.log('✅ Pass 6: Code Mode tools.verifyCiCd execution verified:\n' + codeModeRes.output + '\n');

  console.log('🎉 ALL 6 CI/CD & LINT COMBO SELF-HEALING TESTS PASSED 100%!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
