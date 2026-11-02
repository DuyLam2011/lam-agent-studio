import { ToolCallPayload } from '../types/tools';

export const RUNTIME_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'read_file',
        description: 'Read file contents with formatted line numbers (Line | Code) and optional line windowing.',
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
        description: 'Surgically replace exact oldContent with newContent in a file. Must match uniquely. Triggers compiler verification.',
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
        name: 'run_command',
        description: 'Execute a shell command in workspace root and retrieve stdout, stderr, and exitCode.',
        parameters: {
          type: 'OBJECT',
          properties: {
            command: { type: 'STRING', description: 'Command to run (e.g. npm test, git status)' }
          },
          required: ['command']
        }
      },
      {
        name: 'list_workspace',
        description: 'Scan directory tree structure to discover files and layout (excludes node_modules, .git).',
        parameters: {
          type: 'OBJECT',
          properties: {
            dirPath: { type: 'STRING', description: 'Subdirectory path or empty for root' }
          }
        }
      }
    ]
  }
];

export class GeminiClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3.5-flash-lite') {
    this.apiKey = apiKey;
    this.model = model.replace(/^models\//, '');
  }

  public async call(contents: any[], systemPrompt: string, temperature: number = 0.2): Promise<{ text: string; toolCalls: ToolCallPayload[] }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: RUNTIME_TOOL_DECLARATIONS,
          generationConfig: { temperature, maxOutputTokens: 8192 }
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let text = '';
      const toolCalls: ToolCallPayload[] = [];

      for (const part of parts) {
        if (part.text) text += (text ? '\n\n' : '') + part.text;
        if (part.functionCall) {
          toolCalls.push({
            id: `tc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: part.functionCall.name,
            args: part.functionCall.args || {}
          });
        }
      }

      return { text, toolCalls };
    } finally {
      clearTimeout(timeout);
    }
  }
}
