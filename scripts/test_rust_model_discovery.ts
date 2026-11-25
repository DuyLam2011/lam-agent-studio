import assert from 'assert';
import { NativeBridgeLoader } from '../electron/services/NativeBridgeLoader';
import { NativeModelBridge } from '../electron/services/NativeModelBridge';
import { ModelDiscoveryService } from '../electron/services/ModelDiscoveryService';
import { isModelValidForProvider } from '../src/components/agent/modelConstants';

async function runTestSuite() {
  console.log('🧪 Starting Rust Native Model Discovery & Father Agent Assignment Test Suite...\n');

  // Test 1: Verify Native Addon is loaded
  console.log('[Test 1] Verifying Native Core Addon availability...');
  const isLoaded = NativeBridgeLoader.isLoaded();
  const native = NativeBridgeLoader.getNative();
  assert.ok(isLoaded, 'Native engine addon should be loaded');
  assert.ok(native?.fastDiscoverPackageModels, 'fastDiscoverPackageModels should be exported');
  assert.ok(native?.fastAssignFatherAgentModel, 'fastAssignFatherAgentModel should be exported');
  assert.ok(native?.fastDetectAccountTier, 'fastDetectAccountTier should be exported');
  console.log('  ✅ Native addon loaded successfully with all model discovery exports.\n');

  // Test 2: Native Rust Discovery for Antigravity (Argon, Gemini 2.5 Pro, 2M context)
  console.log('[Test 2] Testing Antigravity package model discovery (Argon & 2M context)...');
  const agyRaw = native.fastDiscoverPackageModels('antigravity', JSON.stringify({ isEnterprise: false }));
  const agyResult = JSON.parse(agyRaw);
  assert.strictEqual(agyResult.provider, 'antigravity');
  assert.ok(agyResult.models.length >= 8, 'Antigravity should have at least 8 models');

  const argon = agyResult.models.find((m: any) => m.id === 'argon');
  assert.ok(argon, 'Argon model must be discovered in Antigravity package');
  assert.strictEqual(argon.context_window, 2000000, 'Argon context window should be 2M tokens');
  assert.strictEqual(argon.reasoning_effort, 'ultra', 'Argon reasoning effort should be ultra');
  assert.strictEqual(argon.is_unlocked, true, 'Argon should be unlocked on Google One AI Premium');
  assert.ok(argon.father_agent_score >= 98, 'Argon father agent score should be >= 98');
  assert.strictEqual(argon.recommended_for_father, true, 'Argon should be recommended for Father Agent');

  const geminiPro = agyResult.models.find((m: any) => m.id === 'gemini-2.5-pro');
  assert.ok(geminiPro, 'Gemini 2.5 Pro must be present in package');
  assert.strictEqual(geminiPro.context_window, 2000000, 'Gemini 2.5 Pro should have 2M context');

  console.log(`  ✅ Discovered ${agyResult.models.length} Antigravity models. Detected tier: ${agyResult.detected_tier.tier_name}`);
  console.log(`  ✅ Model 'argon': ${argon.name} (Context: ${argon.context_window.toLocaleString()} tokens, Score: ${argon.father_agent_score}/100)\n`);

  // Test 3: Native Rust Discovery for Codex (OpenAI o3-mini, o1, gpt-6.2-astra)
  console.log('[Test 3] Testing OpenAI Codex package discovery...');
  const codexRaw = native.fastDiscoverPackageModels('codex', JSON.stringify({ planType: 'team' }));
  const codexResult = JSON.parse(codexRaw);
  assert.strictEqual(codexResult.provider, 'codex');
  assert.ok(codexResult.models.length >= 5, 'Codex should have preset models');

  const o3Mini = codexResult.models.find((m: any) => m.id === 'o3-mini');
  assert.ok(o3Mini, 'o3-mini should be present in Codex package');
  assert.strictEqual(o3Mini.recommended_for_father, true, 'o3-mini should be recommended for Father Agent');

  const gpt6Astra = codexResult.models.find((m: any) => m.id === 'gpt-6.2-astra');
  assert.ok(gpt6Astra, 'gpt-6.2-astra should be present in Codex package');

  console.log(`  ✅ Discovered ${codexResult.models.length} Codex models. Detected tier: ${codexResult.detected_tier.tier_name}\n`);

  // Test 4: Dynamic parsing of raw models_cache.json payload in Rust
  console.log('[Test 4] Testing dynamic models ingestion from raw JSON in Rust...');
  const mockCachePayload = JSON.stringify({
    models: [
      { slug: 'custom-fine-tuned-agent', display_name: 'Custom Fine-Tuned Agent 70B', description: 'Internal tuned LLM', supported_reasoning_levels: [{ effort: 'ultra' }] }
    ]
  });
  const dynamicRaw = native.fastDiscoverPackageModels('codex', mockCachePayload);
  const dynamicResult = JSON.parse(dynamicRaw);
  const customModel = dynamicResult.models.find((m: any) => m.id === 'custom-fine-tuned-agent');
  assert.ok(customModel, 'Dynamic custom model from cache should be ingested');
  assert.strictEqual(customModel.reasoning_effort, 'high');
  assert.strictEqual(customModel.is_unlocked, true);
  console.log(`  ✅ Ingested dynamic model '${customModel.id}' with Father Agent score ${customModel.father_agent_score}/100.\n`);

  // Test 5: Father Agent Model Assignment in Native Rust
  console.log('[Test 5] Testing Father Agent model assignment in Rust...');
  const assignArgonRaw = native.fastAssignFatherAgentModel('antigravity', 'argon', '{}');
  const assignArgon = JSON.parse(assignArgonRaw);
  assert.strictEqual(assignArgon.success, true, 'Assignment of argon should succeed');
  assert.strictEqual(assignArgon.assigned_model_id, 'argon');
  assert.strictEqual(assignArgon.persona, 'lead-architect');
  assert.strictEqual(assignArgon.context_window, 2000000);
  assert.strictEqual(assignArgon.reasoning_effort, 'ultra');
  assert.ok(assignArgon.audit_note.includes('lead-architect') || assignArgon.audit_note.includes('Lead Architect'), 'Audit note should mention Lead Architect');
  console.log(`  ✅ Successfully assigned 'argon' to Father Agent: ${assignArgon.audit_note}\n`);

  // Test 6: Father Agent assignment for Claude 3.7 Sonnet
  console.log('[Test 6] Testing Father Agent assignment for Claude 3.7 Sonnet...');
  const assignBridgeRes = NativeModelBridge.assignFatherAgentModel('claudecode', 'claude-3-7-sonnet', '{}');
  assert.strictEqual(assignBridgeRes.success, true);
  assert.strictEqual(assignBridgeRes.assigned_model_id, 'claude-3-7-sonnet');
  assert.strictEqual(assignBridgeRes.father_agent_score, 99);
  console.log(`  ✅ Successfully assigned 'claude-3-7-sonnet' to Father Agent via NativeModelBridge with score 99/100.\n`);

  // Test 7: ModelDiscoveryService TypeScript integration
  console.log('[Test 7] Testing ModelDiscoveryService TypeScript layer & cache...');
  const service = new ModelDiscoveryService();
  const discoAgy = service.getDiscoveredModels('antigravity');
  assert.strictEqual(discoAgy.provider, 'antigravity');
  assert.ok(discoAgy.models.some((m) => m.id === 'argon'));

  const accountStatusModels = service.getModelsForAccountStatus('antigravity');
  assert.ok(accountStatusModels.length >= 8);
  assert.ok(accountStatusModels.some((m) => m.id === 'argon'));
  console.log(`  ✅ ModelDiscoveryService returned ${accountStatusModels.length} models for Antigravity status.\n`);

  // Test 8: Model Validation for Provider (isModelValidForProvider)
  console.log('[Test 8] Testing isModelValidForProvider...');
  assert.strictEqual(isModelValidForProvider('antigravity', 'argon'), true, 'argon must be valid for antigravity');
  assert.strictEqual(isModelValidForProvider('antigravity', 'gemini-2.5-pro'), true, 'gemini-2.5-pro must be valid for antigravity');
  assert.strictEqual(isModelValidForProvider('antigravity', 'claude-sonnet-4-6'), true, 'claude-sonnet-4-6 must be valid for antigravity');
  assert.strictEqual(isModelValidForProvider('codex', 'o3-mini'), true, 'o3-mini must be valid for codex');
  assert.strictEqual(isModelValidForProvider('codex', 'gpt-6.2-astra'), true, 'gpt-6.2-astra must be valid for codex');
  assert.strictEqual(isModelValidForProvider('claudecode', 'claude-3-7-sonnet'), true, 'claude-3-7-sonnet must be valid for claudecode');
  console.log('  ✅ All package models verified as valid for their respective providers.\n');

  console.log('🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS!');
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
