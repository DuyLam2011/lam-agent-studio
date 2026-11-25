import assert from 'assert';
import { NativeBridgeLoader } from '../electron/services/NativeBridgeLoader';
import { FatherDelegationService } from '../electron/services/FatherDelegationService';

async function runDelegationPipelineTest() {
  console.log('🧪 Starting Father Agent ➔ Codex Delegation Pipeline Test Suite...\n');

  // Test 1: Native Rust Contract Generation
  console.log('[Test 1] Verifying Native Rust fastBuildDelegationContract...');
  const native = NativeBridgeLoader.getNative();
  assert.ok(native?.fastBuildDelegationContract, 'fastBuildDelegationContract must be exported from native core');
  assert.ok(native?.fastVerifyDelegationExecution, 'fastVerifyDelegationExecution must be exported from native core');

  const userPrompt = 'Tạo một component hiển thị dữ liệu người dùng và sửa file src/components/UserProfile.tsx';
  const fileContext = 'src/components/UserProfile.tsx\nsrc/services/UserService.ts';
  const rawContract = native.fastBuildDelegationContract(
    userPrompt,
    fileContext,
    'ChatGPT (OpenAI)',
    'OpenAI Codex Engine'
  );

  const contract = JSON.parse(rawContract);
  assert.ok(contract.contract_id.startsWith('contract_'), 'Contract ID should start with contract_');
  assert.strictEqual(contract.father_agent_model, 'ChatGPT (OpenAI)');
  assert.strictEqual(contract.coding_agent_engine, 'OpenAI Codex Engine');
  assert.strictEqual(contract.status, 'pending_approval');
  assert.ok(contract.cleared_requirements.length >= 3, 'Should have at least 3 cleared requirements');
  assert.ok(contract.invariants.length >= 3, 'Should have strict invariants');
  console.log('Target files extracted:', contract.target_files);
  assert.ok(contract.target_files.length > 0, 'Should have target files');
  assert.ok(contract.target_files.some((f: string) => f.includes('UserProfile.tsx')), 'Should extract target file');

  console.log(`  ✅ Contract generated: ${contract.contract_id}`);
  console.log(`  ✅ Father Agent Model: ${contract.father_agent_model}`);
  console.log(`  ✅ Coding Agent Engine: ${contract.coding_agent_engine}`);
  console.log(`  ✅ Cleared Requirements: ${contract.cleared_requirements.length} points`);
  console.log(`  ✅ Target Files: ${contract.target_files.join(', ')}\n`);

  // Test 2: Native Rust Execution Verification (Clean Pass)
  console.log('[Test 2] Verifying Native Rust fastVerifyDelegationExecution (Clean Pass)...');
  const cleanDiff = 'export const UserProfile = () => <div>Hello User</div>;';
  const cleanTest = 'PASS: UserProfile.test.tsx (3 tests passed)';
  const rawVerify = native.fastVerifyDelegationExecution(JSON.stringify(contract), cleanDiff, cleanTest);
  const verifyResult = JSON.parse(rawVerify);

  assert.strictEqual(verifyResult.passed, true);
  assert.strictEqual(verifyResult.quality_score, 98);
  assert.ok(verifyResult.father_verdict.includes('VERIFIED & APPROVED'));
  console.log(`  ✅ Quality Score: ${verifyResult.quality_score}/100`);
  console.log(`  ✅ Verdict: ${verifyResult.father_verdict}\n`);

  // Test 3: Native Rust Execution Verification (Placeholder Violation Detection)
  console.log('[Test 3] Verifying Invariant Guard: Detecting Placeholder Violation (// TODO)...');
  const dirtyDiff = 'export const UserProfile = () => { // TODO: implement later \n return null; }';
  const dirtyVerify = JSON.parse(native.fastVerifyDelegationExecution(JSON.stringify(contract), dirtyDiff, cleanTest));

  assert.strictEqual(dirtyVerify.passed, false);
  assert.ok(dirtyVerify.violations.some((v: string) => v.includes('TODO')));
  assert.ok(dirtyVerify.father_verdict.includes('CHANGES REQUIRED'));
  console.log(`  ✅ Successfully caught violation: ${dirtyVerify.violations[0]}\n`);

  // Test 4: FatherDelegationService TypeScript Layer
  console.log('[Test 4] Testing FatherDelegationService TypeScript lifecycle...');
  const service = new FatherDelegationService();
  const created = service.createContract(userPrompt, fileContext);
  assert.strictEqual(created.status, 'pending_approval');

  // Test status progression: pending_approval -> executing -> completed
  const executing = service.updateContractStatus(created.contract_id, 'executing');
  assert.strictEqual(executing?.status, 'executing');

  const completed = service.updateContractStatus(created.contract_id, 'completed');
  assert.strictEqual(completed?.status, 'completed');

  const retrieved = service.getContract(created.contract_id);
  assert.strictEqual(retrieved?.status, 'completed');
  console.log(`  ✅ Lifecycle progression verified: pending_approval ➔ executing ➔ completed\n`);

  console.log('🎉 ALL 4 FATHER AGENT ➔ CODEX PIPELINE TESTS PASSED 100%!');
}

runDelegationPipelineTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
