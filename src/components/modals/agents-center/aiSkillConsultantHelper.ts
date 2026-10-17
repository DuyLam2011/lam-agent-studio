import { AiSkillRecommendation } from '../../../types/skills';

export const fallbackSkillRecommendations: AiSkillRecommendation[] = [
  {
    id: 'rec-perf',
    name: 'React & Electron Performance Auditor',
    folderName: 'react_perf_auditor',
    category: 'architecture',
    description: 'Analyzes re-renders, memory leaks, and framerate bottlenecks.',
    rationale: 'Tailored for desktop Electron apps to ensure lightweight glassmorphism rendering.',
    suggestedContent: '---\nname: react_perf_auditor\ndescription: Audit React components for rendering performance\n---\n\n# Directives\n1. Check for unnecessary re-renders in Zustand selectors.\n2. Verify memoization and cleanup in useEffect.'
  },
  {
    id: 'rec-vitest',
    name: 'Strict Unit Test Synthesizer',
    folderName: 'unit_test_synthesizer',
    category: 'testing',
    description: 'Synthesizes atomic test cases with 100% branch coverage.',
    rationale: 'Ensures modules stay strictly under 150 lines with verified regression guards.',
    suggestedContent: '---\nname: unit_test_synthesizer\ndescription: Generate Vitest unit test cases\n---\n\n# Workflow\n1. Target exported pure functions.\n2. Mock external IPC bridges.'
  }
];

export async function consultAiForSkills(
  targetRepoPath?: string,
  workspaceName?: string,
  model?: string
): Promise<AiSkillRecommendation[]> {
  let packageInfo = '';
  if (targetRepoPath) {
    try {
      // @ts-ignore
      const pkgRes = await window.lamApi?.fs?.readFile?.(`${targetRepoPath}/package.json`);
      if (pkgRes?.success) packageInfo = pkgRes.data.slice(0, 1200);
    } catch {}
  }

  const prompt = `You are a Principal Software Platform Engineer & AI Agent Architect.
Analyze this codebase and recommend 3 specialized, practical Agent Skills for this project.
Workspace: ${workspaceName || 'Workspace'}
Target Repo: ${targetRepoPath || 'Root'}
Dependencies / Package snippet:
${packageInfo || 'Full-stack TypeScript / React / Electron'}

Return a JSON array of objects with schema:
[
  {
    "id": "skill-1",
    "name": "Skill Title",
    "folderName": "skill_folder_name",
    "category": "code-quality" | "security" | "devops" | "testing" | "architecture",
    "description": "Brief description of when this skill applies",
    "rationale": "Why this specific skill accelerates vibecoding in this repository",
    "suggestedContent": "---\\nname: skill_folder_name\\ndescription: description\\n---\\n\\n# Directives\\n1. Step one\\n2. Step two"
  }
]
Output ONLY valid JSON.`;

  // @ts-ignore
  const response = await window.lamApi?.ai?.sendPrompt?.(prompt, {
    model: model || 'gemini-1.5-pro-latest',
    mode: 'vibe',
    persona: 'architect'
  });

  if (response?.text) {
    try {
      const jsonMatch = response.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  return fallbackSkillRecommendations;
}
