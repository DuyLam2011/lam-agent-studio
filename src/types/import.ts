export type ImportCategory = 'rule' | 'skill' | 'workflow' | 'plugin' | 'subagent' | 'memory';

export interface UniversalImportResult {
  detectedType: ImportCategory;
  name: string;
  description: string;
  content: string;
  confidence: number;
  reasoning: string;
  metadata?: Record<string, any>;
}
