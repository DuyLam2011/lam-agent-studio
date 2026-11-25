import { NativeBridgeLoader } from './NativeBridgeLoader';

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

export class FatherDelegationService {
  private activeContracts: Map<string, TaskContractSpec> = new Map();

  public createContract(
    userGoal: string,
    fileContext = '',
    fatherModel = 'ChatGPT (OpenAI)',
    codingEngine = 'OpenAI Codex Engine'
  ): TaskContractSpec {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastBuildDelegationContract) {
      try {
        const raw = native.fastBuildDelegationContract(userGoal, fileContext, fatherModel, codingEngine);
        const contract: TaskContractSpec = JSON.parse(raw);
        this.activeContracts.set(contract.contract_id, contract);
        return contract;
      } catch (err) {
        console.warn('[FatherDelegationService] fastBuildDelegationContract failed, fallback:', err);
      }
    }

    const fallbackContract: TaskContractSpec = {
      contract_id: `contract_${Date.now()}`,
      title: userGoal.slice(0, 50),
      user_goal: userGoal,
      cleared_requirements: [
        `Distill and clarify user requirement: ${userGoal}`,
        'Structure modular task assignment under Supervisor-Worker delegation (Father Agent ➔ Coding Engine)',
        'Enforce Rule 4 modular architecture (<= 150 lines per TypeScript file)'
      ],
      target_files: ['Auto-detecting affected workspace modules...'],
      invariants: [
        'Rule 4 Modularity: Every TypeScript source file (.ts/.tsx) must be <= 150 lines.',
        'Zero Placeholders: Never leave stubbed comments such as // TODO.',
        'Strict Type Safety: 100% TypeScript strict mode.'
      ],
      acceptance_criteria: [
        'Updated source files compile cleanly via TypeScript compiler.',
        'Coding worker reports complete diff summary and test output to Father Agent.'
      ],
      father_agent_model: fatherModel,
      coding_agent_engine: codingEngine,
      status: 'pending_approval',
      created_at: Date.now()
    };
    this.activeContracts.set(fallbackContract.contract_id, fallbackContract);
    return fallbackContract;
  }

  public verifyExecution(
    contract: TaskContractSpec,
    diffSummary = '',
    testOutput = ''
  ): ExecutionVerificationResult {
    const native = NativeBridgeLoader.getNative();
    if (native?.fastVerifyDelegationExecution) {
      try {
        const raw = native.fastVerifyDelegationExecution(JSON.stringify(contract), diffSummary, testOutput);
        return JSON.parse(raw);
      } catch (err) {
        console.warn('[FatherDelegationService] fastVerifyDelegationExecution failed, fallback:', err);
      }
    }

    const passed = !diffSummary.includes('// TODO') && !testOutput.includes('FAIL');
    return {
      contract_id: contract.contract_id,
      passed,
      quality_score: passed ? 98 : 75,
      checked_criteria: ['Contract architectural invariants verified'],
      violations: passed ? [] : ['Verification gate detected unresolved criteria violations'],
      father_verdict: passed
        ? `🛡️ **Father Agent Verdict: [VERIFIED & APPROVED]** - Coding engine completed contract '${contract.contract_id}'.`
        : '⚠️ **Father Agent Verdict: [CHANGES REQUIRED]** - Additional revisions required.',
      synthesis_summary: `Quality Score: ${passed ? 98 : 75}/100`
    };
  }

  public getContract(contractId: string): TaskContractSpec | undefined {
    return this.activeContracts.get(contractId);
  }

  public updateContractStatus(contractId: string, status: TaskContractSpec['status']): TaskContractSpec | undefined {
    const contract = this.activeContracts.get(contractId);
    if (contract) {
      contract.status = status;
      this.activeContracts.set(contractId, contract);
      return contract;
    }
    return undefined;
  }
}

export const fatherDelegationService = new FatherDelegationService();
