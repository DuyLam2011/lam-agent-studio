import { AGENT_TOOLS, ToolDefinition, ToolParam } from './toolList';

export type { ToolDefinition, ToolParam };
export { AGENT_TOOLS };

const READ_ONLY = new Set(AGENT_TOOLS.filter((t) => t.readOnly).map((t) => t.name));

export const isReadOnlyTool = (name: string): boolean => READ_ONLY.has(name);

export const toGeminiTools = () => [{
  functionDeclarations: AGENT_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        Object.entries(t.properties).map(([k, p]) => [k, { type: p.type.toUpperCase(), description: p.description }])
      ),
      ...(t.required ? { required: t.required } : {})
    }
  }))
}];

export const toOpenAITools = () => AGENT_TOOLS.map((t) => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: { type: 'object', properties: t.properties, ...(t.required ? { required: t.required } : {}) }
  }
}));
