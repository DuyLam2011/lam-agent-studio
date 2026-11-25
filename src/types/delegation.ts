export interface TaskContractSpec {
  contract_id: string;
  title: string;
  user_goal: string;
  cleared_requirements: string[];
  target_files: string[];
  invariants: string[];
  acceptance_criteria: string[];
  father_agent_model: string;
  coding_agent_engine: string;
  status: 'pending_approval' | 'authorized' | 'executing' | 'completed' | 'rejected';
  created_at: number;
}

export interface ExecutionVerificationResult {
  contract_id: string;
  passed: boolean;
  quality_score: number;
  checked_criteria: string[];
  violations: string[];
  father_verdict: string;
  synthesis_summary: string;
}
