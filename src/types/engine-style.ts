export type CommunicationTone = 'caveman' | 'executive' | 'collaborative' | 'academic';
export type ExplanationVerbosity = 'terse' | 'concise' | 'detailed' | 'exhaustive';

export interface ToneOptionMeta {
  id: CommunicationTone;
  label: string;
  badge: string;
  description: string;
  tokenSavings: string;
  icon: string;
}

export interface VerbosityOptionMeta {
  id: ExplanationVerbosity;
  label: string;
  description: string;
}

export const COMMUNICATION_TONES: ToneOptionMeta[] = [
  {
    id: 'caveman',
    label: 'Caveman Mode',
    badge: '-75% Tokens',
    description: 'Ultra-compressed telegraphic speech. No filler, max speed & highest token efficiency.',
    tokenSavings: '~75% Token Reduction',
    icon: 'Zap'
  },
  {
    id: 'executive',
    label: 'Executive-First',
    badge: 'Standard',
    description: 'Bottom-line verdict upfront, structured bullet points, concise technical summaries.',
    tokenSavings: '~25% Token Reduction',
    icon: 'ShieldCheck'
  },
  {
    id: 'collaborative',
    label: 'Collaborative',
    badge: 'Interactive',
    description: 'Pair-programming style. Conversational, thoughtful, and cooperative reasoning.',
    tokenSavings: 'Baseline',
    icon: 'Users'
  },
  {
    id: 'academic',
    label: 'Deep Academic',
    badge: 'Rigorous',
    description: 'Formal architectural rigor, algorithmic complexity analysis, and pattern justifications.',
    tokenSavings: '+30% Verbose',
    icon: 'BookOpen'
  }
];

export const EXPLANATION_VERBOSITIES: VerbosityOptionMeta[] = [
  {
    id: 'terse',
    label: 'Terse (Minimal)',
    description: 'Code & essential findings only. Zero introductory prose or decorative filler.'
  },
  {
    id: 'concise',
    label: 'Concise (Balanced)',
    description: 'Clear bullet points with direct rationales. Optimal balance for everyday coding.'
  },
  {
    id: 'detailed',
    label: 'Detailed (In-Depth)',
    description: 'Step-by-step logic breakdown, edge case discussion, and design context.'
  },
  {
    id: 'exhaustive',
    label: 'Exhaustive (Deep Dive)',
    description: 'Complete trace of alternatives considered, theoretical implications, and diagrams.'
  }
];

export const getTonePromptDirective = (
  tone: CommunicationTone = 'executive',
  verbosity: ExplanationVerbosity = 'concise'
): string => {
  if (tone === 'caveman') {
    return [
      `[COMMUNICATION TONE: CAVEMAN MODE - ULTRA-COMPRESSED TOKEN SAVINGS (~75% REDUCTION)]:`,
      `- Respond terse like smart caveman. All technical substance stays. Only fluff dies.`,
      `- Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/happy to), hedging.`,
      `- Fragments OK. Short synonyms (big not extensive, fix not "implement a solution for").`,
      `- Pattern: [thing] [action] [reason]. [next step].`,
      `- No tool-call narration. No decorative tables or excess emoji. Standard acronyms OK (DB/API/HTTP).`,
      `- Technical terms exact. Code blocks and error strings quoted exact. Zero conversational filler.`
    ].join('\n');
  }

  const toneDirectives: Record<Exclude<CommunicationTone, 'caveman'>, string> = {
    executive: `[COMMUNICATION TONE: EXECUTIVE-FIRST]: State the bottom-line verdict upfront on the first line. Use concise bullet points, crisp findings, and direct remediation. No conversational preamble.`,
    collaborative: `[COMMUNICATION TONE: COLLABORATIVE PAIR-PROGRAMMER]: Act as an insightful, cooperative senior pair-programming partner. Provide clear explanations, ask helpful clarifying checks, and explain architectural trade-offs thoughtfully.`,
    academic: `[COMMUNICATION TONE: FORMAL ACADEMIC & ARCHITECTURAL RIGOR]: Provide rigorous theoretical backing, formal algorithmic complexity (Big-O), design pattern classifications, and formal software invariant proofs.`
  };

  const verbosityDirectives: Record<ExplanationVerbosity, string> = {
    terse: `[EXPLANATION DEPTH: TERSE]: Minimal prose. Only output the essential verdict, code changes, and verification outcomes. Zero auxiliary elaboration.`,
    concise: `[EXPLANATION DEPTH: CONCISE]: Balanced summary. Key findings and short actionable rationales.`,
    detailed: `[EXPLANATION DEPTH: DETAILED]: Thorough walkthrough. Detail the root causes, step-by-step resolution, and potential edge cases.`,
    exhaustive: `[EXPLANATION DEPTH: EXHAUSTIVE]: Deep dive. Comprehensive architectural analysis, alternatives considered, security implications, and full invariant traces.`
  };

  return `${toneDirectives[tone]}\n${verbosityDirectives[verbosity]}`;
};
