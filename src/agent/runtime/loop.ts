import { AgentTools } from '../tools/tools';
import { ContextLoader } from '../context/context-loader';
import { AgentGeminiClient } from './client';
import {
  AgentLoopOptions,
  AgentFinalResult,
  AgentStepRecord,
  AgentFileDiffSnapshot,
  GitStatusSummary,
  ToolResult
} from '../types';

export class AgentLoop {
  private tools: AgentTools;
  private contextLoader: ContextLoader;
  private client: AgentGeminiClient;
  private options: AgentLoopOptions;

  constructor(workspaceRoot: string, options: AgentLoopOptions = {}) {
    this.tools = new AgentTools(workspaceRoot);
    this.contextLoader = new ContextLoader(workspaceRoot);
    this.client = new AgentGeminiClient(options.apiKey, options.model);
    this.options = options;
  }

  public async run(userGoal: string): Promise<AgentFinalResult> {
    const maxTurns = this.options.maxIterations || 5;
    const baseInstruction = [
      'You are a Production-Grade Autonomous Coding Agent (equivalent to Antigravity & Claude Code).',
      'Follow this strict 3-Phase Execution Protocol:',
      '1. Phase 1 (Survey & Read): Before patching any file, call read_file_range to inspect lines and context.',
      '2. Phase 2 (Surgical Patch): Call patch_file to replace exact code blocks without rewriting whole files.',
      '3. Phase 3 (Verification & Sanitization): The runtime automatically verifies TypeScript / linter checks after each patch. If errors occur, analyze diagnostics and fix them immediately.',
      'Always aim for clean compiler verification before delivering your final answer.'
    ].join('\n');

    const systemInstruction = await this.contextLoader.injectSystemInstruction(baseInstruction);
    const contents: any[] = [{ role: 'user', parts: [{ text: userGoal }] }];
    const diffSnapshots: AgentFileDiffSnapshot[] = [];
    const history: AgentStepRecord[] = [];
    let verifiedClean = true;
    let gitStatus: GitStatusSummary | undefined;
    let finalAnswer = '';

    for (let turn = 1; turn <= maxTurns; turn++) {
      const response = await this.client.generateTurn(contents, systemInstruction);

      if (response.toolCalls && response.toolCalls.length > 0) {
        contents.push({
          role: 'model',
          parts: response.toolCalls.map((tc) => ({ functionCall: { name: tc.name, args: tc.args } }))
        });

        const functionResponses = [];
        for (const tc of response.toolCalls) {
          const res = await this.dispatchTool(tc.name, tc.args);
          let extraNote = '';

          // Phase 2 -> 3 Transition: Automatic Verification on patch_file
          if (tc.name === 'patch_file' && res.success) {
            if (res.metadata) diffSnapshots.push(res.metadata);
            const verifyRes = await this.tools.verify_project(this.options.verificationCommand);
            verifiedClean = verifyRes.success;

            if (!verifyRes.success) {
              extraNote = `\n\n[AUTOMATIC VERIFICATION FAILED (${verifyRes.commandUsed})]\n${verifyRes.errors}\nFix these diagnostics now.`;
            } else if (verifyRes.commandUsed !== 'none') {
              extraNote = `\n\n[AUTOMATIC VERIFICATION PASSED (${verifyRes.commandUsed})] 0 compiler/linter errors.`;
            }
          }

          history.push({ step: turn, action: tc.name, target: tc.args?.filePath, output: res.output, error: res.error });
          functionResponses.push({
            functionResponse: { name: tc.name, response: { output: `${res.output}${extraNote}`, error: res.error } }
          });
        }
        contents.push({ role: 'user', parts: functionResponses });
      } else {
        finalAnswer = response.text || 'Goal achieved with all checks verified.';
        break;
      }
    }

    // Phase 3 Sanitization: Inspect Git working tree before final return
    if (diffSnapshots.length > 0) {
      const gitRes = await this.tools.inspect_git_status();
      if (gitRes.success && gitRes.metadata) {
        gitStatus = gitRes.metadata;
      }
    }

    return {
      success: verifiedClean,
      finalAnswer: finalAnswer || 'Completed execution turns.',
      totalIterations: history.length,
      history,
      verifiedClean,
      gitStatus,
      diffSnapshots
    };
  }

  private async dispatchTool(name: string, args: any): Promise<ToolResult> {
    switch (name) {
      case 'read_file_range': return this.tools.read_file_range(args);
      case 'patch_file': return this.tools.patch_file(args);
      case 'inspect_git_status': return this.tools.inspect_git_status();
      case 'verify_project': {
        const v = await this.tools.verify_project(args?.customCommand);
        return {
          success: v.success,
          output: v.success ? `Verification passed (${v.commandUsed})` : `Verification failed (${v.commandUsed}):\n${v.errors}`,
          error: v.success ? undefined : v.errors,
          executionTimeMs: 0,
          metadata: v
        };
      }
      case 'run_command': return this.tools.run_command(args);
      case 'list_workspace': return this.tools.list_workspace(args);
      default: return { success: false, output: '', error: `Unknown tool '${name}'`, executionTimeMs: 0 };
    }
  }
}
