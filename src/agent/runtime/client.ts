export interface ToolCallPayload {
  id: string;
  name: string;
  args: Record<string, any>;
}

export const AGENT_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'read_file_range',
        description: 'Phase 1 Survey tool: Read exact line range of a file with line numbers (Line | Code). Defaults to first 200 lines if range is omitted.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filePath: { type: 'STRING', description: 'Relative path to file in workspace' },
            startLine: { type: 'INTEGER', description: '1-based starting line number (optional)' },
            endLine: { type: 'INTEGER', description: '1-based ending line number (optional)' }
          },
          required: ['filePath']
        }
      },
      {
        name: 'patch_file',
        description: 'Phase 2 Surgical patch: Replace oldContent with newContent. Must be unique. Triggers automatic compiler verification.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filePath: { type: 'STRING', description: 'Relative path to file in workspace' },
            oldContent: { type: 'STRING', description: 'Exact code block to be replaced' },
            newContent: { type: 'STRING', description: 'New replacement code block' }
          },
          required: ['filePath', 'oldContent', 'newContent']
        }
      },
      {
        name: 'verify_project',
        description: 'Phase 3 Verification tool: Runs static compiler / linter checks (tsc / npm run lint) to ensure zero errors.',
        parameters: {
          type: 'OBJECT',
          properties: {
            customCommand: { type: 'STRING', description: 'Optional custom verification command override' }
          }
        }
      },
      {
        name: 'inspect_git_status',
        description: 'Phase 3 Sanitization tool: Inspect git working tree changes (git status --porcelain and git diff --stat).',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'run_command',
        description: 'Execute a non-interactive shell command (Git Bash/POSIX shell) in workspace.',
        parameters: {
          type: 'OBJECT',
          properties: { command: { type: 'STRING', description: 'Shell command to execute' } },
          required: ['command']
        }
      },
      {
        name: 'list_workspace',
        description: 'Scan workspace directory tree structure up to maxDepth.',
        parameters: {
          type: 'OBJECT',
          properties: {
            dirPath: { type: 'STRING', description: 'Subdirectory path' },
            maxDepth: { type: 'INTEGER', description: 'Max depth to traverse' }
          }
        }
      }
    ]
  }
];

export class AgentGeminiClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = '', model: string = 'gemini-3.5-flash-lite') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model;
  }

  public async generateTurn(
    contents: any[],
    systemInstruction: string
  ): Promise<{ text?: string; toolCalls?: ToolCallPayload[] }> {
    if (!this.apiKey) {
      return { text: '[NO_API_KEY] Please configure GEMINI_API_KEY to run autonomous coding turns.' };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction: { parts: [{ text: systemInstruction }] },
        tools: AGENT_TOOL_DECLARATIONS,
        generationConfig: { temperature: 0.1 }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const toolCalls: ToolCallPayload[] = [];
    let textResponse = '';

    for (const part of parts) {
      if (part.functionCall) {
        toolCalls.push({
          id: Math.random().toString(36).substring(7),
          name: part.functionCall.name,
          args: part.functionCall.args || {}
        });
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    return { text: textResponse.trim() || undefined, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
  }
}
