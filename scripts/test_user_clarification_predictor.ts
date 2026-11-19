import { predictClarificationNeeds, compileClarificationDirective } from '../src/services/clarification/userClarificationPredictor';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

export async function runClarificationPredictorTests() {
  console.log('⚡ Starting Proactive User Clarification Predictor Test Suite...\n');

  // 1. Destructive Command Risk Prediction
  const destructivePrompt = 'drop database production_db and delete all tables';
  const destructivePred = predictClarificationNeeds(destructivePrompt);
  assert(destructivePred.needsClarification === true, 'Destructive operation flags clarification gate');
  assert(destructivePred.category === 'destructive_risk', 'Categorizes as destructive_risk');
  assert(destructivePred.necessityScore >= 90, 'High necessity score for destructive operation (>=90)');
  assert(destructivePred.questions.length > 0, 'Generates safety questions');
  assert(destructivePred.questions[0].options.some(o => o.isRecommended), 'Offers recommended safe dry-run option');

  // 2. Missing Prerequisite (Authentication Strategy)
  const authPrompt = 'implement user login and signup authentication flow';
  const authPred = predictClarificationNeeds(authPrompt);
  assert(authPred.needsClarification === true, 'Detects missing auth prerequisites');
  assert(authPred.category === 'prerequisite_missing', 'Categorizes as prerequisite_missing');
  assert(authPred.necessityScore >= 75, 'Necessity score >= 75 for missing architecture');
  const authQ = authPred.questions.find(q => q.id === 'q-auth-strategy');
  assert(authQ !== undefined, 'Asks specific auth strategy question');
  assert(authQ!.options.some(o => o.id === 'opt-oauth-pkce' && o.isRecommended), 'Recommends OAuth 2.0 PKCE with secure storage');

  // 3. Missing Prerequisite (Database & Persistence Engine)
  const dbPrompt = 'create tables and models to store data for agent history';
  const dbPred = predictClarificationNeeds(dbPrompt);
  assert(dbPred.needsClarification === true, 'Detects unspecified database engine');
  assert(dbPred.category === 'dependency_choice', 'Categorizes as dependency_choice');
  const dbQ = dbPred.questions.find(q => q.id === 'q-storage-engine');
  assert(dbQ !== undefined, 'Asks specific storage engine question');
  assert(dbQ!.options.some(o => o.id === 'opt-sqlite-drizzle'), 'Includes embedded SQLite with typed migrations');

  // 4. Architectural Trade-off (Broad Refactoring)
  const refactorPrompt = 'refactor and overhaul the code';
  const refactorPred = predictClarificationNeeds(refactorPrompt);
  assert(refactorPred.needsClarification === true, 'Broad refactor requires scope clarification');
  assert(refactorPred.category === 'architectural_tradeoff', 'Categorizes as architectural_tradeoff');
  const refactorQ = refactorPred.questions.find(q => q.id === 'q-refactor-depth');
  assert(refactorQ !== undefined, 'Asks depth of refactoring question');
  assert(refactorQ!.options.some(o => o.promptDirective.includes('<150 lines')), 'Recommends Rule 4 modular refactoring');

  // 5. Anti-Loop & Grounded Prompts Zero-Friction Invariant
  const groundedPrompt = 'fix typo in src/components/agent/AgentHeader.tsx line 42';
  const groundedPred = predictClarificationNeeds(groundedPrompt);
  assert(groundedPred.needsClarification === false, 'Grounded prompt executes directly without asking');
  assert(groundedPred.necessityScore <= 25, 'Low necessity score for explicit grounded tasks');

  // 6. Directive Compilation & Anti-Loop Immunity
  const compiledDirective = compileClarificationDirective(
    authPred,
    { 'q-auth-strategy': ['opt-oauth-pkce'] },
    'Must support desktop offline session fallback'
  );
  assert(compiledDirective.includes('[USER CLARIFICATION CONFIRMED'), 'Contains confirmed header');
  assert(compiledDirective.includes('OAuth 2.0 PKCE'), 'Contains chosen option label');
  assert(compiledDirective.includes('Must support desktop offline session fallback'), 'Contains user custom constraint');

  const recheckPred = predictClarificationNeeds(compiledDirective);
  assert(recheckPred.needsClarification === false, 'Anti-loop gate: Confirmed clarification never re-triggers questions');

  console.log('\n🎉 ALL PROACTIVE USER CLARIFICATION PREDICTOR TESTS PASSED 100%!');
}

if (process.argv[1] && process.argv[1].endsWith('test_user_clarification_predictor.ts')) {
  runClarificationPredictorTests().catch((err) => {
    console.error('Fatal predictor test error:', err);
    process.exit(1);
  });
}
