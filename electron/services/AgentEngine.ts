import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { simpleGit } from 'simple-git';
import { contextBatchEngine } from './ContextBatchEngine';
import { FileSecurityHarness } from './FileSecurityHarness';
import { SurgicalPatchEngine } from './SurgicalPatchEngine';
import { NodeReplEngine } from './NodeReplEngine';

export interface ToolCallResult {
  id: string;
  name: string;
  args: any;
  status: 'running' | 'success' | 'failed';
  result?: any;
  executionTimeMs?: number;
  autoApproved?: boolean;
}

export interface AgentResponse {
  text: string;
  thinking?: string;
  toolCalls?: ToolCallResult[];
  diffSnapshots?: Array<{
    id: string;
    filePath: string;
    relativePath: string;
    action: 'modified' | 'created';
    originalContent: string;
    newContent: string;
    linesAdded: number;
    linesRemoved: number;
    timestamp: number;
  }>;
}

export interface AgentPromptOptions {
  model?: string;
  mode?: string;
  persona?: string;
  autonomyLevel?: string;
  securityMode?: 'turbo' | 'guarded' | 'restricted';
  apiKey?: string;
  provider?: 'gemini' | 'openai' | 'ollama' | 'offline';
  baseUrl?: string;
  activeFilePath?: string;
  workspacePath?: string;
  rules?: Array<{ name: string; scope: string; content: string; filePath?: string }>;
  skills?: Array<{ name: string; folderName?: string; scope: string; description: string; content: string }>;
  workflows?: Array<{ name: string; description: string; steps: any[] }>;
  plugins?: Array<{ name: string; description: string; toolsExposed: string[] }>;
  subagents?: Array<{ name: string; role: string; systemPrompt: string }>;
  memories?: Array<{ title: string; category: string; content: string }>;
  contextAttachments?: Array<{
    id: string;
    name: string;
    path: string;
    type: string;
    lineRange?: { startLine: number; endLine: number };
    snippet?: string;
  }>;
  systemPrompt?: string;
  temperature?: number;
}

export class AgentEngine {
  private workspaceRoot: string = process.cwd();
  private activeDiffSnapshots: any[] = [];

  public setWorkspaceRoot(dir: string) {
    if (dir) {
      this.workspaceRoot = dir;
    }
  }

  public getDiffSnapshots(): any[] {
    return [...this.activeDiffSnapshots];
  }

  /**
   * Main entry point to process a prompt and run the agentic tool loop
   */
  public async processPrompt(text: string, options: AgentPromptOptions = {}): Promise<AgentResponse> {
    this.activeDiffSnapshots = [];
    const workspace = options.workspacePath || this.workspaceRoot;
    this.setWorkspaceRoot(workspace);

    const provider = options.provider || (options.apiKey ? 'gemini' : 'offline');
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';

    // 1. Gather all active context from Agents Center
    const context = await this.gatherContext(workspace, options.activeFilePath, options);

    // 2. Route based on provider
    if (provider === 'gemini' && apiKey) {
      return this.runGeminiLoop(text, apiKey, options, context);
    } else if (provider === 'openai' && apiKey) {
      return this.runOpenAILoop(text, apiKey, options, context);
    } else if (provider === 'ollama') {
      return this.runOpenAILoop(text, 'ollama', options, context, options.baseUrl || 'http://localhost:11434/v1');
    } else {
      // Offline / Intelligent fallback execution
      return this.runOfflineAgent(text, options, context);
    }
  }

  /**
   * Read dynamic rules, skills, workflows, plugins, subagents, and memories
   */
  private async gatherContext(
    workspace: string,
    activeFilePath?: string,
    options?: AgentPromptOptions
  ): Promise<string> {
    const rules: string[] = [];
    if (options?.rules && options.rules.length > 0) {
      for (const rule of options.rules) {
        rules.push(`[Rule Scope: ${rule.scope.toUpperCase()} | Name: ${rule.name}]\n${rule.content}`);
      }
    } else {
      for (const ruleFileName of ['GEMINI.md', 'CLAUDE.md', '.cursorrules', '.rules']) {
        try {
          const filePath = path.join(workspace, ruleFileName);
          const content = await fs.readFile(filePath, 'utf-8');
          rules.push(`[Rule File: ${ruleFileName}]\n${content.slice(0, 1500)}`);
        } catch {}
      }
    }

    const skills: string[] = [];
    if (options?.skills && options.skills.length > 0) {
      for (const skill of options.skills) {
        skills.push(`[Skill (${skill.scope.toUpperCase()}): ${skill.name}]\nDescription: ${skill.description}\n${skill.content.slice(0, 1500)}`);
      }
    }

    const workflows: string[] = [];
    if (options?.workflows && options.workflows.length > 0) {
      for (const wf of options.workflows) {
        workflows.push(`[Workflow: ${wf.name}]\n${wf.description}\nSteps:\n${wf.steps.map((st: any, i: number) => `${i + 1}. [${st.role}] ${st.name}: ${st.instructions}`).join('\n')}`);
      }
    }

    const plugins: string[] = [];
    if (options?.plugins && options.plugins.length > 0) {
      for (const pl of options.plugins) {
        plugins.push(`[Plugin / MCP: ${pl.name}]\n${pl.description}\nTools: ${pl.toolsExposed.join(', ')}`);
      }
    }

    const subagents: string[] = [];
    if (options?.subagents && options.subagents.length > 0) {
      for (const sa of options.subagents) {
        subagents.push(`[Subagent Role: ${sa.name} (${sa.role})]\nDirective: ${sa.systemPrompt.slice(0, 600)}`);
      }
    }

    const memories: string[] = [];
    if (options?.memories && options.memories.length > 0) {
      for (const m of options.memories) {
        memories.push(`[Memory: ${m.title} (${m.category})]\n${m.content}`);
      }
    }

    let activeFileContext = '';
    if (activeFilePath) {
      try {
        const content = await fs.readFile(activeFilePath, 'utf-8');
        activeFileContext = `\n[Currently Active Editor File: ${path.basename(activeFilePath)}]\nPath: ${activeFilePath}\nContent Preview:\n${content.slice(0, 2000)}`;
      } catch {}
    }

    const attachmentsContext: string[] = [];
    if (options?.contextAttachments && options.contextAttachments.length > 0) {
      for (const att of options.contextAttachments) {
        if (att.snippet) {
          attachmentsContext.push(`[Attached Context: ${att.name}${att.lineRange ? ` (Lines ${att.lineRange.startLine}-${att.lineRange.endLine})` : ''}]\nPath: ${att.path}\n\`\`\`\n${att.snippet}\n\`\`\``);
        } else if (att.type === 'file' && att.path) {
          try {
            const target = path.isAbsolute(att.path) ? att.path : path.join(workspace, att.path);
            const content = await fs.readFile(target, 'utf-8');
            attachmentsContext.push(`[Attached File Context: ${att.name}]\nPath: ${att.path}\n\`\`\`\n${content.slice(0, 6000)}\n\`\`\``);
          } catch {}
        }
      }
    }

    const batch = await contextBatchEngine.getUnifiedBatch(workspace);
    const unifiedContextBatchStr = batch ? `\n${batch.distilledContext}\n` : '';

    const osName = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
    return `Workspace Directory: ${workspace}
Operating System: ${osName}
Environment: Desktop Agent Studio IDE
${unifiedContextBatchStr}
${attachmentsContext.length > 0 ? '\nExplicit Attached User Context:\n' + attachmentsContext.join('\n\n') : ''}
${rules.length > 0 ? '\nActive Scoped Rules:\n' + rules.join('\n\n') : ''}
${skills.length > 0 ? '\nActive Scoped Skills:\n' + skills.join('\n\n') : ''}
${workflows.length > 0 ? '\nAutonomous Workflows:\n' + workflows.join('\n\n') : ''}
${plugins.length > 0 ? '\nConnected Plugins & MCP:\n' + plugins.join('\n\n') : ''}
${subagents.length > 0 ? '\nAvailable Subagent Roles:\n' + subagents.join('\n\n') : ''}
${memories.length > 0 ? '\nProject Memory & Decisions:\n' + memories.join('\n\n') : ''}
${activeFileContext}`;
  }

  /**
   * Execute real tools on the local machine securely
   */
  public async executeTool(name: string, args: any, securityMode?: string): Promise<any> {
    const startTime = Date.now();
    try {
      const mode = (securityMode as 'restricted' | 'guarded' | 'turbo') || 'guarded';
      let result: any;

      switch (name) {
        case 'read_file': {
          const chk = FileSecurityHarness.validatePath(this.workspaceRoot, args.path, 'read', mode);
          if (!chk.allowed) throw new Error(chk.reason);
          const raw = await fs.readFile(chk.resolvedPath, 'utf-8');
          result = SurgicalPatchEngine.formatWindowedContent(raw, args.startLine, args.endLine);
          break;
        }

        case 'write_file': {
          const chk = FileSecurityHarness.validatePath(this.workspaceRoot, args.path, 'write', mode);
          if (!chk.allowed) throw new Error(chk.reason);

          let originalContent = '';
          let action: 'modified' | 'created' = 'created';
          try {
            originalContent = await fs.readFile(chk.resolvedPath, 'utf-8');
            action = 'modified';
          } catch {}

          await fs.mkdir(path.dirname(chk.resolvedPath), { recursive: true });
          await fs.writeFile(chk.resolvedPath, args.content, 'utf-8');

          const linesAdded = args.content ? args.content.split('\n').length : 0;
          const linesRemoved = originalContent ? originalContent.split('\n').length : 0;

          this.activeDiffSnapshots.push({
            id: `diff-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            filePath: chk.resolvedPath,
            relativePath: chk.relativePath,
            action,
            originalContent,
            newContent: args.content,
            linesAdded,
            linesRemoved,
            timestamp: Date.now()
          });

          result = `Successfully wrote ${args.content.length} characters to ${chk.relativePath}`;
          if (linesAdded > 150) {
            result += ` [ADVISORY: File has ${linesAdded} lines. Consider modularizing into <150 line sub-modules.]`;
          }
          break;
        }

        case 'edit_file': {
          const chk = FileSecurityHarness.validatePath(this.workspaceRoot, args.path, 'write', mode);
          if (!chk.allowed) throw new Error(chk.reason);

          const current = await fs.readFile(chk.resolvedPath, 'utf-8');
          const patchRes = SurgicalPatchEngine.applySurgicalEdit(
            current,
            args.targetContent,
            args.replacementContent
          );

          await fs.writeFile(chk.resolvedPath, patchRes.updatedContent, 'utf-8');

          this.activeDiffSnapshots.push({
            id: `diff-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            filePath: chk.resolvedPath,
            relativePath: chk.relativePath,
            action: 'modified' as const,
            originalContent: current,
            newContent: patchRes.updatedContent,
            linesAdded: patchRes.linesAdded,
            linesRemoved: patchRes.linesRemoved,
            timestamp: Date.now()
          });

          result = `Successfully patched ${chk.relativePath} (${patchRes.matchType}, +${patchRes.linesAdded}/-${patchRes.linesRemoved} lines)`;
          break;
        }

        case 'run_command': {
          const cmdChk = FileSecurityHarness.checkCommandPermission(args.command, mode);
          if (!cmdChk.allowed) throw new Error(cmdChk.reason);

          const bashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
          const cmdToRun = process.platform === 'win32' && fsSync.existsSync(bashPath)
            ? `"${bashPath}" -l -c ${JSON.stringify(args.command)}`
            : (process.platform === 'win32' && !args.command.trim().startsWith('cmd /c')
                ? `cmd /c "${args.command}"`
                : args.command);

          result = await new Promise((resolve) => {
            exec(cmdToRun, { cwd: this.workspaceRoot, timeout: 30000 }, (error, stdout, stderr) => {
              if (error) {
                resolve(`Exit Code: ${error.code || 1}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr || error.message}`);
              } else {
                resolve(`Exit Code: 0\n${stdout || stderr || '(No output)'}`);
              }
            });
          });
          break;
        }

        case 'list_directory': {
          const targetRel = args.path || '.';
          const chk = FileSecurityHarness.validatePath(this.workspaceRoot, targetRel, 'read', mode);
          if (!chk.allowed) throw new Error(chk.reason);

          const items = await fs.readdir(chk.resolvedPath, { withFileTypes: true });
          result = items.map(i => ({ name: i.name, isDirectory: i.isDirectory() }));
          break;
        }

        case 'git_status': {
          const git = simpleGit(this.workspaceRoot);
          const status = await git.status();
          result = {
            currentBranch: status.current,
            modified: status.modified,
            created: status.created,
            deleted: status.deleted,
            staged: status.staged,
            not_added: status.not_added
          };
          break;
        }

        case 'js':
        case 'node_repl': {
          const code = args.code || args.script || '';
          if (!code) throw new Error('Code argument is required for js/node_repl tool');
          const replRes = await NodeReplEngine.execute(code, this.workspaceRoot);
          if (!replRes.success) throw new Error(replRes.output);
          result = replRes.output;
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        status: 'success' as const,
        result,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        status: 'failed' as const,
        result: err.message || 'Tool execution failed',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Google Gemini Function Calling ReAct Loop
   */
  private async runGeminiLoop(
    userText: string,
    apiKey: string,
    options: AgentPromptOptions,
    context: string
  ): Promise<AgentResponse> {
    const rawModel = options.model || 'gemini-3.5-flash-lite';
    const model = rawModel.replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemInstruction = `${options.systemPrompt ? options.systemPrompt + '\n\n' : ''}You are L.A.M Agent, an autonomous software architect and engineer operating inside the L.A.M Agent Studio IDE.
${context}

When solving requests:
1. Use your tools to inspect files and directory state first before making assumptions.
2. When creating or editing files, use write_file or edit_file.
3. When running terminal commands, execute them via run_command.
4. Output your reasoning concisely before or during tool execution.`;

    const toolsDeclaration = [
      {
        functionDeclarations: [
          {
            name: 'read_file',
            description: 'Read file contents in workspace with optional line windowing (startLine, endLine)',
            parameters: {
              type: 'OBJECT',
              properties: {
                path: { type: 'STRING', description: 'Relative or absolute file path' },
                startLine: { type: 'INTEGER', description: 'Optional starting line number (1-based)' },
                endLine: { type: 'INTEGER', description: 'Optional ending line number (1-based, inclusive)' }
              },
              required: ['path']
            }
          },
          {
            name: 'write_file',
            description: 'Create a new file or completely overwrite a file with content',
            parameters: {
              type: 'OBJECT',
              properties: {
                path: { type: 'STRING', description: 'File path to write' },
                content: { type: 'STRING', description: 'Full content of the file' }
              },
              required: ['path', 'content']
            }
          },
          {
            name: 'edit_file',
            description: 'Surgically replace exact targetContent with replacementContent in a file',
            parameters: {
              type: 'OBJECT',
              properties: {
                path: { type: 'STRING', description: 'File path to modify' },
                targetContent: { type: 'STRING', description: 'Exact string to be replaced' },
                replacementContent: { type: 'STRING', description: 'Exact replacement string' }
              },
              required: ['path', 'targetContent', 'replacementContent']
            }
          },
          {
            name: 'run_command',
            description: 'Run a shell terminal command in the workspace directory (executed via cmd /c on Windows)',
            parameters: {
              type: 'OBJECT',
              properties: { command: { type: 'STRING', description: 'Shell command string to execute' } },
              required: ['command']
            }
          },
          {
            name: 'list_directory',
            description: 'List files and directories in a given folder',
            parameters: {
              type: 'OBJECT',
              properties: { path: { type: 'STRING', description: 'Directory path (optional, defaults to workspace root)' } }
            }
          },
          {
            name: 'git_status',
            description: 'Retrieve current git status (modified, staged, untracked files)',
            parameters: { type: 'OBJECT', properties: {} }
          },
          {
            name: 'js',
            description: 'Execute Node.js / JavaScript code in workspace environment with fast access to node:fs/promises, node:path, node:child_process, and nodeRepl. Useful for batch reading files, inspecting directories, and processing data in <400ms.',
            parameters: {
              type: 'OBJECT',
              properties: {
                code: { type: 'STRING', description: 'JavaScript/Node.js code string to execute' }
              },
              required: ['code']
            }
          }
        ]
      }
    ];

    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: userText }]
      }
    ];

    const executedTools: ToolCallResult[] = [];
    let finalText = '';
    let thinkingProcess = '';

    // Loop up to 5 tool turns to allow iterative multi-step actions
    for (let turn = 0; turn < 5; turn++) {
      const payload = {
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        tools: toolsDeclaration,
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: 8192
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content) {
        break;
      }

      const parts = candidate.content.parts || [];
      const functionCalls: any[] = [];

      for (const part of parts) {
        if (part.thought) {
          thinkingProcess += (thinkingProcess ? '\n' : '') + part.text;
        } else if (part.text) {
          finalText += (finalText ? '\n\n' : '') + part.text;
        }
        if (part.functionCall) {
          functionCalls.push(part.functionCall);
        }
      }

      if (functionCalls.length === 0) {
        // Model has completed thinking and returned response
        break;
      }

      // Add model's function calls to conversation history
      contents.push(candidate.content);

      // Execute each function call and gather responses
      const functionResponseParts: any[] = [];

      for (const fc of functionCalls) {
        const toolId = `tc-${Math.random().toString(36).substring(7)}`;
        thinkingProcess += (thinkingProcess ? '\n' : '') + `Executing tool: ${fc.name} with args: ${JSON.stringify(fc.args)}`;

        const toolRes = await this.executeTool(fc.name, fc.args, options.securityMode);

        executedTools.push({
          id: toolId,
          name: fc.name,
          args: fc.args,
          status: toolRes.status,
          result: toolRes.result,
          executionTimeMs: toolRes.executionTimeMs,
          autoApproved: options.securityMode === 'turbo' || (options.securityMode !== 'restricted' && options.autonomyLevel !== 'ask-all')
        });

        functionResponseParts.push({
          functionResponse: {
            name: fc.name,
            response: { output: toolRes.result }
          }
        });
      }

      contents.push({
        role: 'function',
        parts: functionResponseParts
      });
    }

    return {
      text: finalText || 'Agent completed all requested tool actions.',
      thinking: thinkingProcess || 'Decomposed user goal and dispatched autonomous tool pipeline.',
      toolCalls: executedTools.length > 0 ? executedTools : undefined,
      diffSnapshots: this.activeDiffSnapshots.length > 0 ? [...this.activeDiffSnapshots] : undefined
    };
  }

  /**
   * OpenAI / Local Ollama Tool-Calling Loop
   */
  private async runOpenAILoop(
    userText: string,
    apiKey: string,
    options: AgentPromptOptions,
    context: string,
    baseUrl: string = 'https://api.openai.com/v1'
  ): Promise<AgentResponse> {
    const model = options.model || 'gpt-4o';
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const systemPrompt = `You are L.A.M Agent, an autonomous IDE agent in L.A.M Agent Studio.
${context}
Always use tools to verify state and perform file or terminal modifications. Execute terminal commands with cmd /c.`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read contents of a file with optional line windowing (startLine, endLine)',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              startLine: { type: 'integer' },
              endLine: { type: 'integer' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Write content to a file or create new file',
          parameters: {
            type: 'object',
            properties: { path: { type: 'string' }, content: { type: 'string' } },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'edit_file',
          description: 'Surgically replace targetContent with replacementContent in a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              targetContent: { type: 'string' },
              replacementContent: { type: 'string' }
            },
            required: ['path', 'targetContent', 'replacementContent']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'run_command',
          description: 'Execute a terminal shell command (via cmd /c on Windows)',
          parameters: {
            type: 'object',
            properties: { command: { type: 'string' } },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_directory',
          description: 'List files and directories in a given folder',
          parameters: {
            type: 'object',
            properties: { path: { type: 'string' } }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'git_status',
          description: 'Get workspace Git status',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'js',
          description: 'Execute Node.js / JavaScript code in workspace environment with fast access to node:fs/promises, node:path, node:child_process, and nodeRepl. Perfect for batch operations in <400ms.',
          parameters: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'JavaScript/Node.js code string to execute' }
            },
            required: ['code']
          }
        }
      }
    ];

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ];

    const executedTools: ToolCallResult[] = [];
    let finalText = '';

    for (let turn = 0; turn < 5; turn++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          tools,
          temperature: 0.2
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI/Ollama API Error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      if (!choice || !choice.message) break;

      const msg = choice.message;
      if (msg.content) {
        finalText += (finalText ? '\n\n' : '') + msg.content;
      }

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        break;
      }

      messages.push(msg);

      for (const tc of msg.tool_calls) {
        const fnName = tc.function.name;
        const fnArgs = JSON.parse(tc.function.arguments || '{}');
        const toolRes = await this.executeTool(fnName, fnArgs, options.securityMode);

        executedTools.push({
          id: tc.id || `tc-${Math.random().toString(36).substring(7)}`,
          name: fnName,
          args: fnArgs,
          status: toolRes.status,
          result: toolRes.result,
          executionTimeMs: toolRes.executionTimeMs,
          autoApproved: options.securityMode === 'turbo' || (options.securityMode !== 'restricted' && options.autonomyLevel !== 'ask-all')
        });

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: typeof toolRes.result === 'string' ? toolRes.result : JSON.stringify(toolRes.result)
        });
      }
    }

    return {
      text: finalText || 'Actions completed.',
      thinking: 'Executed OpenAI tool-calling loop.',
      toolCalls: executedTools.length > 0 ? executedTools : undefined,
      diffSnapshots: this.activeDiffSnapshots.length > 0 ? [...this.activeDiffSnapshots] : undefined
    };
  }

  /**
   * Offline / Intelligent Local Fallback Engine
   * Executes real tools deterministically when no API key is configured!
   */
  private async runOfflineAgent(
    userText: string,
    _options: AgentPromptOptions,
    _context: string
  ): Promise<AgentResponse> {
    const lower = userText.toLowerCase();
    const executedTools: ToolCallResult[] = [];

    // Case 1: Git status check
    if (lower.includes('git status') || lower.includes('check git') || lower.includes('git changes')) {
      const toolRes = await this.executeTool('git_status', {});
      executedTools.push({
        id: 'tc-git-1',
        name: 'git_status',
        args: {},
        status: toolRes.status,
        result: toolRes.result,
        executionTimeMs: toolRes.executionTimeMs,
        autoApproved: true
      });

      const st = toolRes.result;
      return {
        text: `### Git Status Overview\n- **Branch**: \`${st.currentBranch || 'unknown'}\`\n- **Modified**: ${st.modified?.length || 0} files\n- **Untracked**: ${st.not_added?.length || 0} files\n- **Staged**: ${st.staged?.length || 0} files\n\n*Tip: Configure your Gemini API Key in the Engine tab for autonomous reasoning.*`,
        thinking: 'Identified Git status request. Executed simple-git inspection.',
        toolCalls: executedTools
      };
    }

    // Case 2: Read file request
    const readFileMatch = userText.match(/(?:read|show|inspect|view)\s+(?:file\s+)?([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)/i);
    if (readFileMatch) {
      const targetFile = readFileMatch[1];
      const toolRes = await this.executeTool('read_file', { path: targetFile });
      executedTools.push({
        id: 'tc-read-1',
        name: 'read_file',
        args: { path: targetFile },
        status: toolRes.status,
        result: typeof toolRes.result === 'string' ? toolRes.result.slice(0, 1000) + '...' : toolRes.result,
        executionTimeMs: toolRes.executionTimeMs,
        autoApproved: true
      });

      return {
        text: toolRes.status === 'success'
          ? `### File Content: \`${targetFile}\`\n\n\`\`\`\n${toolRes.result}\n\`\`\``
          : `Could not read \`${targetFile}\`: ${toolRes.result}`,
        thinking: `Identified file read command targeting '${targetFile}'. Executed fs.readFile.`,
        toolCalls: executedTools
      };
    }

    // Case 3: List files / directory
    if (lower.includes('list files') || lower.includes('dir') || lower.includes('show files')) {
      const toolRes = await this.executeTool('list_directory', {});
      executedTools.push({
        id: 'tc-list-1',
        name: 'list_directory',
        args: { path: '.' },
        status: toolRes.status,
        result: toolRes.result,
        executionTimeMs: toolRes.executionTimeMs,
        autoApproved: true
      });

      const items = (toolRes.result as any[]) || [];
      const dirCount = items.filter(i => i.isDirectory).length;
      const fileCount = items.length - dirCount;

      return {
        text: `### Workspace Directory Listing\nFound **${fileCount}** files and **${dirCount}** directories in root.\n\n${items.slice(0, 15).map(i => `- ${i.isDirectory ? '📁' : '📄'} \`${i.name}\``).join('\n')}${items.length > 15 ? '\n- *...and more*' : ''}`,
        thinking: 'Identified workspace directory inspection command.',
        toolCalls: executedTools
      };
    }

    // Case 4: Run command
    const runCmdMatch = userText.match(/(?:run|exec|execute)\s+(?:command\s+)?["'`]([^"'`]+)["'`]/i);
    if (runCmdMatch) {
      const cmd = runCmdMatch[1];
      const toolRes = await this.executeTool('run_command', { command: cmd });
      executedTools.push({
        id: 'tc-cmd-1',
        name: 'run_command',
        args: { command: cmd },
        status: toolRes.status,
        result: toolRes.result,
        executionTimeMs: toolRes.executionTimeMs,
        autoApproved: true
      });

      return {
        text: `### Command Execution Result\nCommand: \`${cmd}\`\n\n\`\`\`\n${toolRes.result}\n\`\`\``,
        thinking: `Executed shell command via cmd /c: '${cmd}'.`,
        toolCalls: executedTools
      };
    }

    // Default: Explain agent capabilities and invite API key configuration
    return {
      text: `### L.A.M Agent Engine Ready\n\nI am operating in **Local Agent Mode**.\n\n**Direct Capabilities (Active Now):**\n- Read files: *"Read package.json"*\n- Inspect Git: *"Check git status"*\n- Directory lookup: *"List files"*\n- Execute commands: *Run command \`cmd /c dir\`*\n\n**To Enable Full Autonomous Reasoning:**\n1. Open the **Engine** tab in the right panel.\n2. Enter your **Google Gemini API Key** (or OpenAI / Ollama endpoint).\n3. Enjoy autonomous multi-turn ReAct code generation, debugging, and refactoring!`,
      thinking: 'No active API key detected in settings. Provided offline interactive guidance and tool list.',
      toolCalls: undefined
    };
  }
}

export const agentEngine = new AgentEngine();
