import { ProviderLinkConfig, ProviderLinkExecutionResult, ProviderLinkTurnRecord } from '../../types/provider-link';

export interface ProviderLinkRunner {
  (provider: string, model: string, prompt: string, opts?: { signal?: AbortSignal; onText?: (t: string) => void }): Promise<{ text: string; thinking?: string }>;
}

export const parseVerifierVerdict = (text: string): { verdict: 'APPROVED' | 'NEEDS_REVISION'; critique: string } => {
  const isApproved = /\[APPROVED\]|APPROVED:/i.test(text) && !/\[NEEDS_REVISION\]/i.test(text);
  return {
    verdict: isApproved ? 'APPROVED' : 'NEEDS_REVISION',
    critique: text.replace(/^\[(APPROVED|NEEDS_REVISION)\]\s*/i, '').trim()
  };
};

export const executeProviderLinkFlow = async (
  userPrompt: string,
  config: ProviderLinkConfig,
  runner: ProviderLinkRunner,
  signal?: AbortSignal
): Promise<ProviderLinkExecutionResult> => {
  const started = Date.now();
  const turns: ProviderLinkTurnRecord[] = [];
  const maxLoops = Math.min(Math.max(1, config.maxIterations), 3);

  // Stage 1: Author Execution
  const authorStart = Date.now();
  const authorRes = await runner(config.sourceProvider, config.sourceModel, userPrompt, { signal });
  turns.push({
    iteration: 1,
    stage: 'author',
    provider: config.sourceProvider,
    model: config.sourceModel,
    text: authorRes.text,
    thinking: authorRes.thinking,
    durationMs: Date.now() - authorStart
  });

  let currentCode = authorRes.text;
  let finalVerdict: 'APPROVED' | 'NEEDS_REVISION' = 'NEEDS_REVISION';
  let loopsRun = 1;

  for (let loop = 1; loop <= maxLoops; loop++) {
    loopsRun = loop;
    // Stage 2: Verifier / Critic Execution
    const verifierPrompt = [
      `[PROVIDER LINK: CROSS-AGENT VERIFICATION & CODE TEST]`,
      `User Goal: ${userPrompt}`,
      `\n--- PROPOSED CODE BY AUTHOR (${config.sourceProvider} · ${config.sourceModel}) ---`,
      currentCode,
      `\n[INSTRUCTIONS]: Review and test this implementation for logical defects, edge-cases, and compliance.`,
      `If fully verified and complete, begin with "[APPROVED]".`,
      `If any issues exist, begin with "[NEEDS_REVISION]" and provide the exact required fixes.`
    ].join('\n');

    const vStart = Date.now();
    const verifierRes = await runner(config.targetProvider, config.targetModel, verifierPrompt, { signal });
    const { verdict, critique } = parseVerifierVerdict(verifierRes.text);
    finalVerdict = verdict;

    turns.push({
      iteration: loop,
      stage: 'verifier',
      provider: config.targetProvider,
      model: config.targetModel,
      text: verifierRes.text,
      thinking: verifierRes.thinking,
      verdict,
      critique,
      durationMs: Date.now() - vStart
    });

    if (verdict === 'APPROVED' || config.mode === '1-pass' || loop >= maxLoops) {
      break;
    }

    // Stage 3: Refinement Ping-Pong Loop
    const refinerPrompt = [
      `[PROVIDER LINK: VERIFIER CRITIQUE DETECTED]`,
      `The Verifier (${config.targetProvider} · ${config.targetModel}) flagged issues:`,
      critique,
      `\nPrevious Implementation:`,
      currentCode,
      `\nTask: Revise and fix all issues raised by the Verifier. Output the complete corrected code.`
    ].join('\n');

    const rStart = Date.now();
    const refinerRes = await runner(config.sourceProvider, config.sourceModel, refinerPrompt, { signal });
    currentCode = refinerRes.text;

    turns.push({
      iteration: loop,
      stage: 'refiner',
      provider: config.sourceProvider,
      model: config.sourceModel,
      text: refinerRes.text,
      thinking: refinerRes.thinking,
      durationMs: Date.now() - rStart
    });
  }

  const badgeHeader = `> 🔗 **Provider Link Execution:** \`${config.sourceProvider}\` (${config.sourceModel}) ➔ \`${config.targetProvider}\` (${config.targetModel})\n> **Verdict:** ${finalVerdict === 'APPROVED' ? '✅ `[APPROVED]`' : '⚠️ `[REVISED & CONSOLIDATED]`'} · **Iterations:** ${loopsRun} / ${maxLoops}\n\n`;

  const lastAuthorOrRefiner = [...turns].reverse().find((t) => t.stage === 'author' || t.stage === 'refiner');
  const codeBody = lastAuthorOrRefiner?.text || currentCode;

  const verifierSummary = turns.filter((t) => t.stage === 'verifier').map((t, idx) => `**Iteration ${idx + 1} Review (${t.model}):**\n${t.text}`).join('\n\n');

  const finalText = `${badgeHeader}### 🛠️ Final Implementation\n\n${codeBody}\n\n---\n### 🔍 Cross-Provider Verification Report\n\n${verifierSummary}`;

  return {
    finalText,
    turns,
    verdict: finalVerdict,
    iterationsRun: loopsRun,
    totalDurationMs: Date.now() - started
  };
};
