export type ProviderLinkMode = 'ping-pong' | '1-pass' | 'test-refine';

export interface ProviderLinkConfig {
  enabled: boolean;
  sourceProvider: string;
  sourceModel: string;
  targetProvider: string;
  targetModel: string;
  mode: ProviderLinkMode;
  maxIterations: number;
}

export interface ProviderLinkTurnRecord {
  iteration: number;
  stage: 'author' | 'verifier' | 'refiner';
  provider: string;
  model: string;
  text: string;
  thinking?: string;
  verdict?: 'APPROVED' | 'NEEDS_REVISION';
  critique?: string;
  durationMs?: number;
}

export interface ProviderLinkExecutionResult {
  finalText: string;
  turns: ProviderLinkTurnRecord[];
  verdict: 'APPROVED' | 'NEEDS_REVISION';
  iterationsRun: number;
  totalDurationMs: number;
}

export const DEFAULT_PROVIDER_LINK_CONFIG: ProviderLinkConfig = {
  enabled: false,
  sourceProvider: 'claudecode',
  sourceModel: 'claude-3-7-sonnet',
  targetProvider: 'codex',
  targetModel: 'gpt-4o',
  mode: 'ping-pong',
  maxIterations: 2
};
