import assert from 'assert';
import { predictClarificationNeeds } from '../src/services/clarification/userClarificationPredictor';
import { findBuiltinCommand } from '../src/services/commands/agentCommandRegistry';

async function runDecisionLevelTests() {
  console.log('🧪 Starting Agent Decision Level & Autonomy Verification Suite...\n');

  // 1. Test Autonomous (JEV Mode) Behavior
  console.log('  Testing "autonomous" level (JEV System One high autonomy)...');
  const authAuto = predictClarificationNeeds('Add user authentication and login feature', { decisionLevel: 'autonomous' });
  assert.strictEqual(authAuto.needsClarification, false, 'Autonomous level must NOT halt for standard Auth features');
  assert(authAuto.necessityScore === 78, 'Necessity score must be preserved');
  console.log('  ✅ JEV Autonomous: Resolves auth implementation without halting user');

  const dbAuto = predictClarificationNeeds('Setup persistence database for storing notes', { decisionLevel: 'autonomous' });
  assert.strictEqual(dbAuto.needsClarification, false, 'Autonomous level must NOT halt for standard DB persistence');
  console.log('  ✅ JEV Autonomous: Adopts embedded storage convention without halting user');

  const destructiveAuto = predictClarificationNeeds('drop database production and delete all records', { decisionLevel: 'autonomous' });
  assert.strictEqual(destructiveAuto.needsClarification, true, 'Autonomous level MUST halt on catastrophic/destructive commands');
  assert(destructiveAuto.necessityScore >= 90, 'Destructive operation scores >= 90');
  console.log('  ✅ JEV Autonomous: Catastrophic operations correctly halted for user safety gate');

  // 2. Test Balanced (Standard Engineering) Behavior
  console.log('\n  Testing "balanced" level (Standard Engineering)...');
  const authBalanced = predictClarificationNeeds('Add user authentication and login feature', { decisionLevel: 'balanced' });
  assert.strictEqual(authBalanced.needsClarification, true, 'Balanced level must clarify missing Auth strategy');
  assert(authBalanced.questions.length > 0, 'Questions must be generated');
  console.log('  ✅ Balanced: Clarifies auth architecture with A/B/C options');

  const groundedBalanced = predictClarificationNeeds('Fix typo in src/components/Header.tsx', { decisionLevel: 'balanced' });
  assert.strictEqual(groundedBalanced.needsClarification, false, 'Grounded targets must execute directly in balanced mode');
  console.log('  ✅ Balanced: Grounded file edits proceed with zero hesitation');

  // 3. Test Inquisitive & Rigorous Levels
  console.log('\n  Testing "inquisitive" and "rigorous" levels...');
  const refactorInq = predictClarificationNeeds('clean up and optimize codebase', { decisionLevel: 'inquisitive' });
  assert.strictEqual(refactorInq.needsClarification, true, 'Inquisitive level must clarify broad refactoring goals');
  console.log('  ✅ Inquisitive: Proactively flags ambiguous scope with recommendations');

  const refactorRigorous = predictClarificationNeeds('clean up and optimize codebase', { decisionLevel: 'rigorous' });
  assert.strictEqual(refactorRigorous.needsClarification, true, 'Rigorous level must conduct full technical interview');
  console.log('  ✅ Rigorous: Conducts exhaustive Socratic interview');

  // 4. Test Command Resolution & Aliases
  console.log('\n  Testing /decision command resolution and aliases...');
  const cmdPrimary = findBuiltinCommand('/decision');
  assert.strictEqual(cmdPrimary.commandDef?.id, 'cmd-decision', '/decision must resolve to cmd-decision');
  console.log('  ✅ Resolves primary command: /decision');

  const cmdAliasClarify = findBuiltinCommand('/clarify');
  assert.strictEqual(cmdAliasClarify.commandDef?.id, 'cmd-decision', '/clarify alias must resolve to cmd-decision');
  console.log('  ✅ Resolves alias: /clarify');

  const cmdAliasInterview = findBuiltinCommand('/interview');
  assert.strictEqual(cmdAliasInterview.commandDef?.id, 'cmd-decision', '/interview alias must resolve to cmd-decision');
  console.log('  ✅ Resolves alias: /interview');

  const cmdAliasLegacy = findBuiltinCommand('/grillme');
  assert.strictEqual(cmdAliasLegacy.commandDef?.id, 'cmd-decision', 'Legacy /grillme alias must resolve to cmd-decision');
  console.log('  ✅ Resolves backward-compatible alias: /grillme');

  console.log('\n🎉 ALL AGENT DECISION LEVEL & JEV TESTS PASSED 100%!');
}

runDecisionLevelTests().catch((err) => {
  console.error('❌ Decision level test failed:', err);
  process.exit(1);
});
