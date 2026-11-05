import { buildContextView } from '../context/context-filter';
import { FatherAgent } from '../orchestration/father-orchestrator';
import { SUB_AGENT_CAPSULES, enforceToolSecurity, executePostPatchVerification } from '../orchestration/sub-agent-capsules';
import { AgentTools } from '../tools/tools';
import { AgentGeminiClient } from './client';
import type {
  AgentRole,
  SessionEvent,
  SubAgentRole,
  ToolName,
  RuntimeProgressEvent,
  RuntimeOptions,
  RuntimeExecutionResult
} from '../types';

export type { RuntimeProgressEvent, RuntimeOptions, RuntimeExecutionResult };

export class MultiAgentCodingRuntime {
  private tools: AgentTools;
  private father: FatherAgent;
  private options: RuntimeOptions;
  private sessionEvents: SessionEvent[] = [];

  constructor(workspaceRoot: string, options: RuntimeOptions = {}) {
    this.tools = new AgentTools(workspaceRoot);
    this.options = options;
    this.father = new FatherAgent(options.registry);
  }

  private emit(ev: Omit<RuntimeProgressEvent, 'timestamp'>): void {
    this.options.onProgress?.({ ...ev, timestamp: Date.now() });
  }

  private record(role: AgentRole, type: SessionEvent['type'], content: string): SessionEvent {
    const event: SessionEvent = { id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, type, content, timestamp: Date.now() };
    this.sessionEvents.push(event);
    this.options.onSessionEvent?.(event);
    return event;
  }

  public async dispatchTool(role: SubAgentRole, name: ToolName, args: any): Promise<string> {
    enforceToolSecurity(role, name);
    if (name === 'read_file_range') return (await this.tools.read_file_range(args)).output;
    if (name === 'glob_files') return (await this.tools.list_workspace(args)).output;
    if (name === 'run_command') return (await this.tools.run_command(args)).output;
    if (name === 'git_diff') return (await this.tools.inspect_git_status()).output;
    if (name === 'grep_search') return (await this.tools.run_command({ command: `git grep -n "${args.query || args.pattern || ''}" || true` })).output;
    if (name === 'patch_file') {
      const patchRes = await this.tools.patch_file(args);
      const verifyRes = await executePostPatchVerification(this.tools);
      const diag = verifyRes.success ? ' [Compiler Verification: 100% CLEAN]' : ` [Compiler Error: ${verifyRes.errors.slice(0, 300)}]`;
      return `${patchRes.output}\n${diag}`;
    }
    throw new Error(`Unsupported tool: ${name}`);
  }

  private async executeStage(role: SubAgentRole, cardId: string, title: string): Promise<string> {
    const capsule = SUB_AGENT_CAPSULES[role];
    this.emit({ cardId, stage: role, status: 'running', title, detail: `Allocated: ${this.father.getModelForRole(role).tier}` });

    try {
      const contextMessages = buildContextView(role, this.sessionEvents);
      const modelAlloc = this.father.getModelForRole(role);
      const client = new AgentGeminiClient(this.options.apiKey, modelAlloc.modelId);
      const turnRes = await client.generateTurn(contextMessages, capsule.systemPrompt);

      let stageOutput = turnRes.text || '';
      if (turnRes.toolCalls && turnRes.toolCalls.length > 0) {
        for (const tc of turnRes.toolCalls) {
          this.record(role, 'internal_scratchpad', `Tool Call: ${tc.name} with args ${JSON.stringify(tc.args)}`);
          const out = await this.dispatchTool(role, tc.name as ToolName, tc.args);
          this.record(role, 'internal_scratchpad', `Tool Result (${tc.name}): ${out.slice(0, 400)}`);
          stageOutput += `\n[Executed ${tc.name}]: ${out.slice(0, 200)}`;
        }
      }

      this.record(role, 'final_output', stageOutput || `Completed stage ${capsule.title}`);
      this.emit({ cardId, stage: role, status: 'completed', title, output: stageOutput });
      return stageOutput;
    } catch (err: any) {
      this.record(role, 'internal_scratchpad', `Execution Error: ${err.message}`);
      this.emit({ cardId, stage: role, status: 'failed', title, error: err.message });
      throw err;
    }
  }

  public async run(userGoal: string): Promise<RuntimeExecutionResult> {
    this.sessionEvents = [];
    this.record('user', 'user_request', userGoal);
    const triage = this.father.triageTask(userGoal);

    try {
      const titles: Record<SubAgentRole, string> = {
        scout: 'Quét mã nguồn & lập Context Map',
        architect: 'Lập bản vẽ kiến trúc & Rule 4',
        engineer: 'Thi công code & Kiểm thử tự động',
        reviewer: 'Kiểm định đối kháng & duyệt kết quả'
      };

      for (const role of triage.pipeline) {
        if (role === 'father') continue;
        const subRole = role as SubAgentRole;
        await this.executeStage(subRole, `card-${subRole}`, `[${subRole.toUpperCase()}] ${titles[subRole]}`);
      }

      const lastOutput = [...this.sessionEvents].reverse().find((e) => e.type === 'final_output')?.content || 'Pipeline completed.';
      const finalAnswer = `### 🛡️ Father Orchestrator Verdict\n**Pipeline Triage:** Level ${triage.level} (${triage.category})\n\n${lastOutput}`;
      this.record('father', 'final_output', finalAnswer);

      return { success: true, triage, sessionEvents: this.sessionEvents, finalAnswer };
    } catch (err: any) {
      return { success: false, triage, sessionEvents: this.sessionEvents, finalAnswer: '', error: err.message };
    }
  }
}
