export const resolveSpecializedPersonaLens = (subagentId: string, _role?: string): string => {
  const id = (subagentId || '').toLowerCase();

  if (id.includes('security') || id.includes('owasp') || id.includes('pentest') || id.includes('harness')) {
    return [
      `[Specialized Security Lens: OWASP & Defense-in-Depth]`,
      `- Check for hardcoded secrets, API keys, tokens, or private credentials.`,
      `- Inspect input sanitization (SQL/Command/NoSQL injection, XSS, prototype pollution).`,
      `- Verify cryptographic practices, JWT signing, password hashing salts, and rate limiting.`,
      `- Audit external network calls, headers, and dependency security.`
    ].join('\n');
  }

  if (id.includes('backend') || id.includes('review') || id.includes('architect')) {
    return [
      `[Specialized Backend Lens: Modularity & Architecture Standards]`,
      `- Enforce Rule 4: Every modified/created file MUST remain strictly <150 lines.`,
      `- Verify 100% strict TypeScript types (no unchecked 'any', proper null handling).`,
      `- Audit error handling: Ensure try/catch blocks protect async operations and IPC channels.`,
      `- Check for resource leaks, unclosed streams, and dangling background timers.`
    ].join('\n');
  }

  if (id.includes('ui') || id.includes('design') || id.includes('css') || id.includes('inspector')) {
    return [
      `[Specialized UI/UX Lens: Design System & Visual Integrity]`,
      `- Enforce design system tokens: surface-panel, border-subtle, text-primary, etc.`,
      `- Verify Dark/Light mode adaptation and WCAG 2.1 color contrast compliance.`,
      `- Audit responsive layouts, flex-shrink boundaries, and custom-scrollbar styling.`,
      `- Ensure interactive states (hover, focus-visible, active) are smooth and accessible.`
    ].join('\n');
  }

  if (id.includes('qa') || id.includes('test') || id.includes('regression')) {
    return [
      `[Specialized QA Lens: Anti-Regression & Invariant Verification]`,
      `- Verify invariant assertions across core execution paths.`,
      `- Test edge cases: empty strings, boundary numbers, undefined payloads.`,
      `- Guarantee that modifications do not break existing test suites or regressions.`
    ].join('\n');
  }

  if (id.includes('log') || id.includes('diagnost') || id.includes('terminal')) {
    return [
      `[Specialized Diagnostician Lens: Root Cause Isolation]`,
      `- Filter terminal noise and isolate the exact failing file and line number.`,
      `- Trace stack call hierarchy leading to the runtime crash or failure.`,
      `- Provide clear surgical patch recommendations for immediate recovery.`
    ].join('\n');
  }

  return `[Standard Domain Lens]: Inspect target code for functional correctness, modularity (<150 lines), performance, and safety.`;
};
