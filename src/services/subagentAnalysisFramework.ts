export interface PersonaContextFilter {
  includedExtensions?: string[];
  excludedExtensions?: string[];
  fileKeywords?: string[];
}

export const PERSONA_CONTEXT_FILTERS: Record<string, PersonaContextFilter> = {
  'subagent-ui-inspector': {
    includedExtensions: ['.tsx', '.jsx', '.css', '.scss', '.html', '.svg', '.json'],
    fileKeywords: ['ui', 'component', 'style', 'view', 'theme', 'layout', 'tailwind', 'button', 'modal']
  },
  'subagent-security-harness': {
    fileKeywords: ['auth', 'security', 'token', 'secret', 'pass', 'crypto', 'login', 'guard', 'api', 'route', 'key', 'harness', '.env']
  },
  'subagent-backend-reviewer': {
    excludedExtensions: ['.css', '.scss', '.svg', '.png', '.jpg'],
    fileKeywords: ['service', 'controller', 'api', 'route', 'server', 'db', 'store', 'engine', 'runtime', 'model']
  },
  'subagent-qa-reviewer': {
    fileKeywords: ['test', 'spec', 'assert', 'verify', 'mock', 'fixture', 'suite']
  }
};

export const filterDiffsForPersona = (diffs: any[], personaId?: string): any[] => {
  if (!personaId || !diffs || diffs.length <= 1) return diffs || [];
  const filter = PERSONA_CONTEXT_FILTERS[personaId];
  if (!filter) return diffs;

  const filtered = diffs.filter((d) => {
    const p = (d.relativePath || d.path || '').toLowerCase();
    if (filter.excludedExtensions?.some((ext) => p.endsWith(ext))) return false;
    if (filter.includedExtensions?.some((ext) => p.endsWith(ext))) return true;
    if (filter.fileKeywords?.some((kw) => p.includes(kw))) return true;
    return false;
  });

  return filtered.length > 0 ? filtered : diffs;
};

export const filterAttachmentsForPersona = (attachments: any[], personaId?: string): any[] => {
  if (!personaId || !attachments || attachments.length <= 1) return attachments || [];
  const filter = PERSONA_CONTEXT_FILTERS[personaId];
  if (!filter) return attachments;

  const filtered = attachments.filter((a) => {
    const p = (a.path || a.name || '').toLowerCase();
    if (filter.excludedExtensions?.some((ext) => p.endsWith(ext))) return false;
    if (filter.includedExtensions?.some((ext) => p.endsWith(ext))) return true;
    if (filter.fileKeywords?.some((kw) => p.includes(kw))) return true;
    return false;
  });

  return filtered.length > 0 ? filtered : attachments;
};

export const getMultiStepAnalysisInstructions = (personaId?: string): string => {
  const personaFocus = personaId ? ` Focus lens: ${personaId}.` : '';
  return [
    `### 🔄 Standard 4-Step Specialist Analysis Rubric${personaFocus}`,
    `Step 1 [SCOPE & BOUNDARY MAPPING]: Map target files, API contracts, and boundary layers within the designated scope.`,
    `Step 2 [INVARIANT & ANOMALY SCAN]: Scan for domain violations (e.g. OWASP vulnerabilities, Rule 4 >150 lines, style token regressions, unhandled exceptions).`,
    `Step 3 [EVIDENCE & CITATION ANCHOR]: Ground every finding with explicit File Path, Line Numbers, and Identifiers. Zero speculation without evidence.`,
    `Step 4 [ACTIONABLE PRESCRIPTION]: Provide exact surgical patch instructions, unified diff snippets, or concrete unit test cases for the Father Agent.`
  ].join('\n');
};
