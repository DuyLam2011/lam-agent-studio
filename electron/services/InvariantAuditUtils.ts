import fs from 'fs/promises';
import path from 'path';

export interface InvariantAuditResult {
  passed: boolean;
  violations: string[];
  lineCountAudit: Record<string, number>;
}

export const auditFileInvariants = async (
  workspaceRoot: string,
  targetFiles: string[] = []
): Promise<InvariantAuditResult> => {
  const violations: string[] = [];
  const lineCountAudit: Record<string, number> = {};

  for (const relPath of targetFiles) {
    if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('dist')) continue;
    const fullPath = path.isAbsolute(relPath) ? relPath : path.join(workspaceRoot, relPath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').length;
      lineCountAudit[relPath] = lines;

      // Rule 4 Modularity Check (< 150 lines)
      if (lines > 150 && !relPath.endsWith('.json') && !relPath.endsWith('.lock') && !relPath.endsWith('.md')) {
        violations.push(`[Rule 4 Violation]: ${relPath} has ${lines} lines (exceeds strictly-enforced 150-line modularity limit).`);
      }

      // Security Invariant Check (Secret Leaks)
      if (/(?:api[_-]?key|secret|token|password|bearer)\s*[:=]\s*['"][a-zA-Z0-9_\-]{24,}['"]/i.test(content)) {
        violations.push(`[Security Invariant Violation]: Possible hardcoded credential or token detected in ${relPath}.`);
      }
    } catch {
      // File may have been deleted or inaccessible
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    lineCountAudit
  };
};

export const detectProjectCommands = async (workspaceRoot: string) => {
  try {
    const raw = await fs.readFile(path.join(workspaceRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    const scripts = pkg.scripts || {};
    return {
      hasTypecheck: Boolean(scripts.typecheck || scripts['tsc:check'] || scripts.build),
      testCmd: scripts.test ? 'npm test' : null,
      buildCmd: scripts['build:vite'] ? 'npm run build:vite' : (scripts.build ? 'npm run build' : null),
      typecheckCmd: scripts.typecheck ? 'npm run typecheck' : 'npx tsc --noEmit'
    };
  } catch {
    return {
      hasTypecheck: false,
      testCmd: null,
      buildCmd: null,
      typecheckCmd: 'npx tsc --noEmit'
    };
  }
};