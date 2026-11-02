export interface VerificationResult {
  passed: boolean;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface VerificationConfig {
  command?: string;
  autoVerifyOnPatch?: boolean;
  timeoutMs?: number;
}
