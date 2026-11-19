import {
  parseVerifierVerdict,
  executeProviderLinkFlow,
  ProviderLinkRunner
} from '../src/services/provider-link/providerLinkOrchestrator';
import { ProviderLinkConfig } from '../src/types/provider-link';

export async function runProviderLinkTests(): Promise<{ passed: boolean; details: string }> {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  log('🧪 Starting Provider Link Cross-Agent Pipeline Test Suite...');

  // Test 1: parseVerifierVerdict
  const approvedTest = parseVerifierVerdict('[APPROVED] All security checks passed.');
  if (approvedTest.verdict !== 'APPROVED' || approvedTest.critique !== 'All security checks passed.') {
    throw new Error(`Failed approvedTest: got ${JSON.stringify(approvedTest)}`);
  }

  const needsRevisionTest = parseVerifierVerdict('[NEEDS_REVISION] Line 42 has a null pointer risk.');
  if (needsRevisionTest.verdict !== 'NEEDS_REVISION' || needsRevisionTest.critique !== 'Line 42 has a null pointer risk.') {
    throw new Error(`Failed needsRevisionTest: got ${JSON.stringify(needsRevisionTest)}`);
  }
  log('  ✅ Test 1: parseVerifierVerdict passed');

  // Test 2: executeProviderLinkFlow - 1-pass Immediate Approval
  const config1Pass: ProviderLinkConfig = {
    enabled: true,
    sourceProvider: 'claudecode',
    sourceModel: 'claude-3-7-sonnet',
    targetProvider: 'codex',
    targetModel: 'gpt-6.1-sol',
    mode: 'ping-pong',
    maxIterations: 2
  };

  const runner1: ProviderLinkRunner = async (provider, _model, prompt) => {
    if (provider === 'claudecode') {
      return { text: 'function add(a: number, b: number): number { return a + b; }' };
    }
    return { text: '[APPROVED] Perfectly typed and concise implementation.' };
  };

  const res1 = await executeProviderLinkFlow('Write an add function', config1Pass, runner1);
  if (res1.verdict !== 'APPROVED' || res1.iterationsRun !== 1 || res1.turns.length !== 2) {
    throw new Error(`Failed 1-pass test: iterations=${res1.iterationsRun}, turns=${res1.turns.length}, verdict=${res1.verdict}`);
  }
  log('  ✅ Test 2: executeProviderLinkFlow (immediate approval) passed');

  // Test 3: executeProviderLinkFlow - Ping-Pong Refinement Loop
  let verifierCallCount = 0;
  const runnerPingPong: ProviderLinkRunner = async (provider, _model, prompt) => {
    if (provider === 'claudecode') {
      if (prompt.includes('REVISE IMPLEMENTATION BASED ON VERIFIER CRITIQUE')) {
        return { text: 'function divide(a: number, b: number): number { if (b === 0) throw new Error("Div by 0"); return a / b; }' };
      }
      return { text: 'function divide(a: number, b: number): number { return a / b; }' };
    } else {
      verifierCallCount++;
      if (verifierCallCount === 1) {
        return { text: '[NEEDS_REVISION] Missing zero division check.' };
      }
      return { text: '[APPROVED] Zero division check added properly.' };
    }
  };

  const resPingPong = await executeProviderLinkFlow('Write a divide function', config1Pass, runnerPingPong);
  if (resPingPong.verdict !== 'APPROVED' || resPingPong.iterationsRun !== 2 || resPingPong.turns.length !== 4) {
    throw new Error(`Failed ping-pong test: iterations=${resPingPong.iterationsRun}, turns=${resPingPong.turns.length}, verdict=${resPingPong.verdict}`);
  }
  log('  ✅ Test 3: executeProviderLinkFlow (ping-pong auto-refinement) passed');

  // Test 4: Circuit breaker honors maxIterations
  const runnerReject: ProviderLinkRunner = async (provider) => {
    if (provider === 'claudecode') return { text: 'initial code' };
    return { text: '[NEEDS_REVISION] Still contains errors.' };
  };

  const resCircuitBreaker = await executeProviderLinkFlow('Write code', config1Pass, runnerReject);
  if (resCircuitBreaker.verdict !== 'NEEDS_REVISION' || resCircuitBreaker.iterationsRun !== 2) {
    throw new Error(`Circuit breaker failed: iterations=${resCircuitBreaker.iterationsRun}, verdict=${resCircuitBreaker.verdict}`);
  }
  log('  ✅ Test 4: Circuit breaker correctly stops at maxIterations passed');

  return {
    passed: true,
    details: logs.join('\n')
  };
}

if (require.main === module) {
  runProviderLinkTests()
    .then((r) => {
      console.log(r.details);
      console.log('🎉 All Provider Link tests passed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Provider Link test failed:', err);
      process.exit(1);
    });
}
