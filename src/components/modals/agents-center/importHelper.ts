import { UniversalImportResult, ImportCategory } from '../../../types/import';

export function heuristicClassify(content: string, fileName?: string): UniversalImportResult {
  const lower = (content + ' ' + (fileName || '')).toLowerCase();

  let detectedType: ImportCategory = 'rule';
  let reasoning = 'Matches generic AI behavioral guidelines and coding standards.';

  if (lower.includes('steps:') || lower.includes('trigger:') || lower.includes('pipeline') || lower.includes('workflow')) {
    detectedType = 'workflow';
    reasoning = 'Detected multi-step autonomous execution pipeline structure.';
  } else if (lower.includes('skill') || lower.includes('skill.md') || lower.includes('directives') || lower.includes('tools:')) {
    detectedType = 'skill';
    reasoning = 'Detected procedural skill or SKILL.md frontmatter directives.';
  } else if (lower.includes('mcp') || lower.includes('server') || lower.includes('toolsexposed') || lower.includes('command:')) {
    detectedType = 'plugin';
    reasoning = 'Detected Model Context Protocol or external tool plugin specification.';
  } else if (lower.includes('persona') || lower.includes('subagent') || lower.includes('role:') || lower.includes('systemprompt')) {
    detectedType = 'subagent';
    reasoning = 'Detected specialized AI subagent persona definition.';
  } else if (lower.includes('decision') || lower.includes('adr') || lower.includes('architecture') || lower.includes('gotcha')) {
    detectedType = 'memory';
    reasoning = 'Detected architectural decision record (ADR) or persistent project memory.';
  }

  const firstLine = content.split('\n').find(l => l.trim().length > 0) || 'Imported Agent Item';
  const cleanName = firstLine.replace(/^[#\-\s*]+/, '').slice(0, 40).trim() || (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Imported Item');

  return {
    detectedType,
    name: cleanName,
    description: `Auto-analyzed ${detectedType} configuration`,
    content,
    confidence: 0.85,
    reasoning
  };
}

export async function analyzeAndClassifyWithAi(
  content: string,
  fileName?: string,
  model?: string
): Promise<UniversalImportResult> {
  const prompt = `You are a Principal AI Agent Architect. Analyze this imported configuration document and classify it into one of these 6 categories:
1. "rule" - Coding standards, constraints, .cursorrules, GEMINI.md
2. "skill" - Modular tool procedures, SKILL.md
3. "workflow" - Multi-step pipelines (Plan -> Code -> Review)
4. "plugin" - MCP server configs, external tools
5. "subagent" - Agent persona definitions (Architect, Builder, etc.)
6. "memory" - Architectural decisions (ADRs), gotchas, project knowledge

Filename: ${fileName || 'unknown'}
Content Excerpt:
${content.slice(0, 2000)}

Respond ONLY with valid JSON:
{
  "detectedType": "rule" | "skill" | "workflow" | "plugin" | "subagent" | "memory",
  "name": "Concise Title",
  "description": "Brief description of its purpose",
  "reasoning": "Why it belongs in this category"
}`;

  try {
    // @ts-ignore
    const res = await window.lamApi?.ai?.sendPrompt?.(prompt, { model, mode: 'chat', persona: 'architect' });
    if (res?.text) {
      const match = res.text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          detectedType: parsed.detectedType || 'rule',
          name: parsed.name || (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Imported Item'),
          description: parsed.description || 'Imported AI configuration',
          content,
          confidence: 0.95,
          reasoning: parsed.reasoning || 'Classified by AI Architect.'
        };
      }
    }
  } catch {}

  return heuristicClassify(content, fileName);
}
