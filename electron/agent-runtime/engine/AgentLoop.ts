import { AgentConfig, AgentState } from '../types/agent';
import { ToolManager } from '../tools/ToolManager';
import { CompilerVerifier } from './CompilerVerifier';
import { GeminiClient } from './GeminiClient';
import { ToolResult } from '../types/tools';

export class AgentLoop {
  private config: AgentConfig;
  private state: AgentState;
  private toolManager: ToolManager;
  private verifier: CompilerVerifier;
  private gemini: GeminiClient;

  constructor(config: AgentConfig) {
    this.config = config;
    this.toolManager = new ToolManager(config.workspaceRoot);
    this.verifier = new CompilerVerifier(config.workspaceRoot, { command: config.verificationCommand });
    this.gemini = new GeminiClient(config.apiKey, config.model);
    this.state = {
      sessionId: `session-${Date.now()}`,
      workspaceRoot: config.workspaceRoot,
      messages: [],
      readFiles: new Map(),
      modifiedFiles: new Set(),
      iterationCount: 0,
      maxIterations: config.maxIterations || 5,
      status: 'idle'
    };
  }

  public getState(): AgentState { return this.state; }

  private buildSystemPrompt(): string {
    return `You are L.A.M Autonomous Coding Agent, an expert software engineer inside L.A.M Agent Studio.
Operating System: ${process.platform === 'win32' ? 'Windows' : 'Unix'}
Workspace: ${this.config.workspaceRoot}

PROTOCOL:
1. Always read target file using read_file to inspect line numbers and context before modifying.
2. Use patch_file for surgical edits. Match oldContent uniquely and provide valid newContent.
3. Every patch_file triggers automatic compiler verification. If verification fails, you will receive diagnostics to fix immediately.
4. Conclude only when code compiles without errors.`;
  }

  public async run(userGoal: string): Promise<AgentState> {
    this.state.status = 'running';
    const contents: any[] = [{ role: 'user', parts: [{ text: userGoal }] }];

    while (this.state.iterationCount < this.state.maxIterations) {
      this.state.iterationCount++;
      const iter = this.state.iterationCount;
      this.config.onStepProgress?.({ type: 'think', label: `Planning iteration ${iter}/${this.state.maxIterations}...`, status: 'running' });

      const response = await this.gemini.call(contents, this.buildSystemPrompt(), this.config.temperature);

      if (response.toolCalls.length === 0) {
        this.state.status = 'completed';
        this.config.onStepProgress?.({ type: 'done', label: `Agent completed task successfully.`, status: 'done' });
        break;
      }

      contents.push({ role: 'model', parts: response.toolCalls.map((tc) => ({ functionCall: { name: tc.name, args: tc.args } })) });

      let patchExecuted = false;
      const functionResponses: any[] = [];

      for (const tc of response.toolCalls) {
        this.config.onStepProgress?.({ type: 'tool', name: tc.name, label: `Executing tool ${tc.name}...`, status: 'running' });
        const res = await this.dispatchTool(tc.name, tc.args);
        this.config.onStepProgress?.({ type: 'tool', name: tc.name, label: `Completed ${tc.name}`, status: res.success ? 'done' : 'failed', timeMs: res.executionTimeMs });

        if (tc.name === 'patch_file' && res.success) {
          patchExecuted = true;
          this.state.modifiedFiles.add(tc.args.filePath);
        }
        functionResponses.push({ functionResponse: { name: tc.name, response: { output: res.output || res.error } } });
      }

      contents.push({ role: 'user', parts: functionResponses });

      // Verification & Self-Correction Hook
      if (patchExecuted) {
        this.config.onStepProgress?.({ type: 'verify', label: `Running compiler verification (${this.config.verificationCommand || 'tsc'})...`, status: 'running' });
        const vRes = await this.verifier.verify();
        this.state.lastVerification = vRes;

        if (!vRes.passed) {
          this.config.onStepProgress?.({ type: 'compiler_feedback', label: `Compiler error detected. Triggering self-correction loop...`, status: 'failed' });
          contents.push({ role: 'user', parts: [{ text: this.verifier.formatFeedbackPrompt(vRes) }] });
        } else {
          this.config.onStepProgress?.({ type: 'verify', label: `Compiler check passed! (Exit 0)`, status: 'done', timeMs: vRes.durationMs });
          contents.push({ role: 'user', parts: [{ text: `[VERIFICATION PASSED]: Compiler check '${vRes.command}' succeeded cleanly with Exit Code 0.` }] });
        }
      }
    }

    if (this.state.iterationCount >= this.state.maxIterations && this.state.status !== 'completed') {
      this.state.status = 'max_iterations_reached';
    }
    return this.state;
  }

  private async dispatchTool(name: string, args: any): Promise<ToolResult> {
    switch (name) {
      case 'read_file': return this.toolManager.readFile(args);
      case 'patch_file': return this.toolManager.patchFile(args);
      case 'run_command': return this.toolManager.runCommand(args);
      case 'list_workspace': return this.toolManager.listWorkspace(args);
      default: return { success: false, output: '', error: `Unknown tool '${name}'`, executionTimeMs: 0 };
    }
  }
}
