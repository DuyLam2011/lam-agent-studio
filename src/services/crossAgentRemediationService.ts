export type RemediationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RemediationContract {
  id: string;
  reporterAgent: string;
  targetFile: string;
  lineRange?: string;
  severity: RemediationSeverity;
  defectType: string;
  diagnosis: string;
  prescribedAction: string;
  assignedFixerAgent: string;
  verifierAgent: string;
  status: 'PENDING' | 'REMEDIATED' | 'VERIFIED' | 'FAILED';
}

export interface TargetedContextPackage {
  contractId: string;
  targetFile: string;
  lineRange?: string;
  scopedSnippet: string;
  compactDirective: string;
  tokenSavingsEstimate: number;
}

export const extractTargetedCodeWindow = (
  fullContent: string,
  targetLine?: number,
  windowSize = 15
): { snippet: string; startLine: number; endLine: number } => {
  if (!fullContent) return { snippet: '', startLine: 1, endLine: 1 };
  const lines = fullContent.split('\n');
  if (!targetLine || targetLine <= 0) {
    const preview = lines.slice(0, windowSize * 2).join('\n');
    return { snippet: preview, startLine: 1, endLine: Math.min(lines.length, windowSize * 2) };
  }

  const startLine = Math.max(1, targetLine - windowSize);
  const endLine = Math.min(lines.length, targetLine + windowSize);
  const snippet = lines.slice(startLine - 1, endLine).map((l, i) => `${startLine + i}: ${l}`).join('\n');
  return { snippet, startLine, endLine };
};

export const buildTargetedRemediationContext = (
  contract: RemediationContract,
  fileContent = ''
): TargetedContextPackage => {
  const lineNum = contract.lineRange ? parseInt(contract.lineRange.split('-')[0], 10) : undefined;
  const windowed = extractTargetedCodeWindow(fileContent, lineNum);

  const fullTokens = Math.max(1, Math.ceil(fileContent.length / 3.8));
  const scopedTokens = Math.max(1, Math.ceil(windowed.snippet.length / 3.8));
  const tokenSavingsEstimate = Math.max(0, Math.round(((fullTokens - scopedTokens) / fullTokens) * 100));

  const directive = [
    `[REMEDIATION TASK: ${contract.id}]`,
    `Reporter: ${contract.reporterAgent} ➔ Assigned Fixer: ${contract.assignedFixerAgent}`,
    `Severity: ${contract.severity} | Defect: ${contract.defectType}`,
    `Location: ${contract.targetFile}${contract.lineRange ? `:${contract.lineRange}` : ''}`,
    `Diagnosis: ${contract.diagnosis}`,
    `Action: ${contract.prescribedAction}`,
    `Verifier: ${contract.verifierAgent}`,
    '--- Scoped Code Window ---',
    windowed.snippet
  ].join('\n');

  return {
    contractId: contract.id,
    targetFile: contract.targetFile,
    lineRange: contract.lineRange,
    scopedSnippet: windowed.snippet,
    compactDirective: directive,
    tokenSavingsEstimate: fileContent ? tokenSavingsEstimate : 0
  };
};

export const executeCrossAgentCorrection = (
  contract: RemediationContract,
  patchedFileContent: string,
  defectPatternValidator: (content: string) => boolean
): RemediationContract => {
  const isDefectResolved = defectPatternValidator(patchedFileContent);
  return {
    ...contract,
    status: isDefectResolved ? 'VERIFIED' : 'FAILED'
  };
};

export const deduplicateRemediationContracts = (
  contracts: RemediationContract[]
): RemediationContract[] => {
  const map = new Map<string, RemediationContract>();

  for (const c of contracts) {
    const key = `${c.targetFile.toLowerCase()}::${c.lineRange || 'any'}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...c });
    } else {
      if (!existing.reporterAgent.includes(c.reporterAgent)) {
        existing.reporterAgent = `${existing.reporterAgent} + ${c.reporterAgent}`;
      }
      if (c.severity === 'CRITICAL' || existing.severity !== 'CRITICAL') {
        existing.severity = c.severity;
      }
      existing.diagnosis = `${existing.diagnosis}; ${c.diagnosis}`;
      existing.prescribedAction = `${existing.prescribedAction}; ${c.prescribedAction}`;
    }
  }

  return Array.from(map.values());
};
