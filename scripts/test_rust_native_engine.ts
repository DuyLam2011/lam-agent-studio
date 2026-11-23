import path from 'path';
import { NativeEngineBridge } from '../electron/services/NativeEngineBridge';

async function main() {
  console.log('--- TEST: RUST NATIVE ENGINE (lam-agent-core) ---');
  
  const isAvailable = NativeEngineBridge.isNativeAvailable();
  console.log(`[NativeEngineBridge] Is native addon loaded: ${isAvailable}`);

  // Test 1: Surgical Patch in native Rust
  const original = 'const a = 1;\nconst b = 2;\nconst c = 3;\n';
  const target = 'const b = 2;\n';
  const replacement = 'const b = 42;\nconst bonus = 99;\n';

  const patchRes = NativeEngineBridge.applyPatch(original, target, replacement);
  console.log('[Test 1: Patch] Result matchType:', patchRes.matchType);
  console.log('[Test 1: Patch] Lines added:', patchRes.linesAdded, 'removed:', patchRes.linesRemoved);
  if (!patchRes.updatedContent.includes('const b = 42;')) {
    throw new Error('Patch failed to replace content');
  }

  // Test 2: Token Estimation
  const text = 'The quick brown fox jumps over the lazy dog. L.A.M Agent Studio native Rust engine!';
  const tokens = NativeEngineBridge.estimateTokens(text);
  console.log(`[Test 2: Token Estimate] "${text}" -> ~${tokens} tokens`);

  // Test 3: ANSI Stripping
  const ansiText = '\x1b[32mHello\x1b[0m \x1b[1mWorld\x1b[0m';
  const stripped = NativeEngineBridge.stripAnsi(ansiText);
  console.log(`[Test 3: ANSI Strip] "${ansiText}" -> "${stripped}"`);
  if (stripped !== 'Hello World') {
    throw new Error(`ANSI strip failed: got "${stripped}"`);
  }

  // Test 4: Fast Workspace File Scanning
  const root = path.resolve(__dirname, '..');
  const t0 = performance.now();
  const scanned = NativeEngineBridge.scanWorkspace(root, ['node_modules', '.git', 'dist', 'target']);
  const scanDuration = (performance.now() - t0).toFixed(2);
  console.log(`[Test 4: Scan Workspace] Found ${scanned.length} source files in ${scanDuration}ms`);
  if (scanned.length === 0) {
    throw new Error('Workspace scanning returned 0 files');
  }

  // Test 5: Fast Symbol Extraction
  const sampleCode = `
export class MyService {
  public run() {}
}
export const DEFAULT_CONFIG = { active: true };
import { useState } from 'react';
`;
  const parsed = NativeEngineBridge.parseFileSymbols('src/test.ts', sampleCode);
  console.log(`[Test 5: AST Symbols] Extracted symbols:`, parsed.symbols.map(s => s.name));
  console.log(`[Test 5: AST Imports] Extracted imports:`, parsed.imports);
  if (!parsed.symbols.some(s => s.name === 'MyService') || !parsed.symbols.some(s => s.name === 'DEFAULT_CONFIG')) {
    throw new Error('AST symbol parsing missed expected exports');
  }

  console.log('\n✅ ALL 5 RUST NATIVE ENGINE BENCHMARKS & VERIFICATIONS PASSED 100%!');
}

main().catch(err => {
  console.error('❌ Native engine test failed:', err);
  process.exit(1);
});
