import { serializeSkillMarkdown } from './skillValidationService';

export interface GeneratedSkillDraft {
  name: string;
  folderName: string;
  description: string;
  content: string;
}

export const generateSkillFromPrompt = async (
  prompt: string,
  category: string = 'workflow'
): Promise<GeneratedSkillDraft> => {
  const cleanCategory = category.toLowerCase();
  const folderName = prompt.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30).replace(/^_+|_+$/g, '') || 'custom_skill';
  const skillTitle = prompt.trim().slice(0, 45);

  const fallbackDescription = `Automate ${prompt.trim()}. Trigger on "${prompt.trim()}" or "/${folderName}".`;
  const fallbackBody = `# ${skillTitle}

## Objective & Responsibility
Execute ${prompt.trim()} following strict agentic best practices. Single responsibility only.

## Inputs
- **Target Files / Context**: Files or commands required for this task.
- **Constraints**: 0 placeholders, strict type compliance, zero regression.

## Execution Workflow
1. [DISCOVERY]: Inspect existing code, files, or environment parameters.
2. [ACTION]: Perform required operations using surgical tools (edit_file / run_command).
3. [VERIFICATION]: Run unit tests or check build status to confirm success.
4. [SAFETY & GUARDRAILS]: Ensure no unauthorized file deletions or privilege escalation.
`;

  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  if (!ai?.sendPrompt) {
    return {
      name: skillTitle,
      folderName,
      description: fallbackDescription,
      content: serializeSkillMarkdown(folderName, fallbackDescription, fallbackBody)
    };
  }

  try {
    const aiPrompt = `You are a Principal AI Skill Architect. Design a production-grade Antigravity skill for the following user requirement:
"${prompt}" (Category: ${cleanCategory})

Respond with the complete SKILL.md file adhering strictly to these rules:
1. Start with YAML frontmatter:
---
name: ${folderName}
description: <Clear trigger description. e.g. Trigger on "..." or /${folderName}>
---
2. Under 400 words (progressive disclosure).
3. Include: Objective, Inputs, 4-Step Execution Workflow, Verification Criteria, Safety Guardrails.
Do not wrap in additional markdown blocks if possible.`;

    const res = await ai.sendPrompt(aiPrompt, { mode: 'chat', maxTokens: 1200 });
    const text = (res?.text || '').trim();
    if (text.includes('---')) {
      const descMatch = text.match(/description:\s*([^\r\n]+)/i);
      return {
        name: skillTitle,
        folderName,
        description: descMatch ? descMatch[1].trim() : fallbackDescription,
        content: text
      };
    }
  } catch (e) {
    console.warn('[SkillAiAssistant] AI generation fallback:', e);
  }

  return {
    name: skillTitle,
    folderName,
    description: fallbackDescription,
    content: serializeSkillMarkdown(folderName, fallbackDescription, fallbackBody)
  };
};

export const polishSkillContent = (currentContent: string, skillName: string): string => {
  const cleanName = skillName.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_') || 'custom_skill';
  let body = currentContent;
  let desc = `Execute ${skillName} with verified deliverables. Trigger on "${skillName}" or "/${cleanName}".`;

  if (currentContent.startsWith('---')) {
    const endIdx = currentContent.indexOf('---', 3);
    if (endIdx !== -1) {
      const yaml = currentContent.slice(3, endIdx);
      const descMatch = yaml.match(/description:\s*([^\r\n]+)/i);
      if (descMatch && descMatch[1].trim()) {
        desc = descMatch[1].trim();
        if (!/trigger/i.test(desc)) {
          desc += ` Trigger on "/${cleanName}" or "${skillName}".`;
        }
      }
      body = currentContent.slice(endIdx + 3).trim();
    }
  }

  // Ensure Verification & Safety steps exist in body
  if (!/verification|verify|test/i.test(body)) {
    body += `\n\n## Verification Criteria\n- Verify all modified files compile cleanly.\n- Run automated tests or linting before reporting completion.`;
  }
  if (!/safety|guard|constraint/i.test(body)) {
    body += `\n\n## Safety Constraints\n- Never delete user files without explicit confirmation.\n- Respect sandbox boundaries.`;
  }

  return serializeSkillMarkdown(cleanName, desc, body);
};
