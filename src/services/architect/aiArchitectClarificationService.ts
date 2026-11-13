import { ArchitectContext, GrillMeQuestion, ArchitectSynthesisResult } from '../../types/ai-architect';

export const buildDefaultGrillMeQuestions = (ctx: ArchitectContext): GrillMeQuestion[] => [
  {
    id: 'q-strictness',
    category: 'strictness',
    question: ctx.targetType === 'rule'
      ? 'Mức độ cưỡng chế kỷ luật mã nguồn (Enforcement Gate Level)?'
      : 'Cơ chế kích hoạt và giám sát của Skill (Activation Model)?',
    options: [
      { key: 'A', label: '(Recommended) Strict Blocking Gate', description: 'Từ chối (Reject) ngay lập tức nếu vi phạm hoặc không vượt qua kiểm định.', recommended: true },
      { key: 'B', label: 'Advisory Warning Only', description: 'Chỉ đưa ra khuyến nghị cảnh báo, cho phép Agent linh hoạt thử nghiệm.' },
      { key: 'C', label: 'Dynamic Adaptive', description: 'Tự động nâng lên mức chặn cứng khi phát hiện rủi ro cao hoặc tệp tin quan trọng.' }
    ],
    selectedOptionKey: 'A'
  },
  {
    id: 'q-scope',
    category: 'scope',
    question: 'Phạm vi áp dụng mục tiêu trong Workspace / Repository?',
    options: [
      { key: 'A', label: '(Recommended) Toàn bộ Repository & Mọi Agent', description: 'Áp dụng đồng bộ cho mọi file và toàn bộ Subagent (Planner, Executor, Reviewer).', recommended: true },
      { key: 'B', label: 'Giới hạn theo File / Module cụ thể', description: 'Chỉ kích hoạt đối với các file có trong Git Diff hoặc các layer được chỉ định.' },
      { key: 'C', label: 'Chỉ Subagent Reviewer & Security Harness', description: 'Chỉ dùng làm tiêu chí đánh giá trong vòng thẩm định chất lượng cuối.' }
    ],
    selectedOptionKey: 'A'
  },
  {
    id: 'q-guardrails',
    category: 'negative_constraints',
    question: 'Ranh giới tiêu cực bắt buộc (Negative Constraints & Anti-patterns)?',
    options: [
      { key: 'A', label: '(Recommended) Ép chuẩn Rule 4 (≤150 dòng) & Cấm placeholder', description: 'Cấm tuyệt đối // TODO, cấm file > 150 dòng, bắt buộc TypeScript strict.', recommended: true },
      { key: 'B', label: 'Chống Hallucination & Bảo vệ Git Working Tree', description: 'Bắt buộc đọc file thực tế qua read_file, không tự ý sửa file ngoài phạm vi diff.' },
      { key: 'C', label: 'Bảo mật OWASP & Không rò rỉ Secrets', description: 'Cấm hardcode token/credentials, kiểm soát input validation nghiêm ngặt.' }
    ],
    selectedOptionKey: 'A'
  }
];

export async function generateGrillMeQuestions(ctx: ArchitectContext, model?: string): Promise<GrillMeQuestion[]> {
  const defaults = buildDefaultGrillMeQuestions(ctx);
  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  if (!ai?.sendPrompt || !ctx.userPrompt.trim()) return defaults;

  const prompt = `You are a Principal AI Agent Architect conducting a Level-Max Grill-Me Technical Interview.
User Request: "${ctx.userPrompt}"
Target: ${ctx.targetType.toUpperCase()}
Workspace: ${ctx.workspaceName || 'Current'} (Repo: ${ctx.repoName || 'Root'})
Git Diff Snippet: ${ctx.gitDiffSnippet ? ctx.gitDiffSnippet.slice(0, 1500) : 'None'}

Generate 3 high-level technical clarification questions to help tailor this ${ctx.targetType}.
Return JSON only matching schema:
[
  {
    "id": "q1",
    "category": "strictness" | "scope" | "triggers" | "negative_constraints",
    "question": "Question text in Vietnamese?",
    "options": [
      { "key": "A", "label": "(Recommended) Option title", "description": "Details", "recommended": true },
      { "key": "B", "label": "Option title", "description": "Details" },
      { "key": "C", "label": "Option title", "description": "Details" }
    ]
  }
]`;

  try {
    const res = await ai.sendPrompt(prompt, { model, temperature: 0.1 });
    const match = res?.text?.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed: GrillMeQuestion[] = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.map((q, idx) => ({ ...q, selectedOptionKey: q.options.find(o => o.recommended)?.key || 'A', id: q.id || `q-${idx}` }));
      }
    }
  } catch {}
  return defaults;
}

export async function synthesizeTailoredArtifact(
  ctx: ArchitectContext,
  questions: GrillMeQuestion[],
  model?: string
): Promise<ArchitectSynthesisResult> {
  const answers = questions.map(q => {
    const chosen = q.options.find(o => o.key === q.selectedOptionKey);
    return `- ${q.question}: ${chosen ? `${chosen.label} (${chosen.description})` : q.customAnswer || 'Default'}`;
  }).join('\n');

  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  const prompt = `You are a Principal Software Platform Engineer. Synthesize a production-ready, tailored ${ctx.targetType.toUpperCase()} file.
User Prompt: "${ctx.userPrompt}"
Target Scope: ${ctx.workspaceName || 'Project'} | Repo: ${ctx.repoName || 'Root'}
Target File: ${ctx.targetFileName || (ctx.targetType === 'rule' ? 'GEMINI.md' : 'SKILL.md')}
Git Diff Context:
${ctx.gitDiffSnippet ? ctx.gitDiffSnippet.slice(0, 2500) : 'Standard codebase conventions'}

Grill-Me Technical Interview Answers:
${answers}

${ctx.targetType === 'skill' ? 'Format with valid YAML frontmatter (--- name, description ---) followed by # Operational Directives, Execution Workflow, and Anti-Patterns.' : 'Format with clear markdown sections: 1. Role & Tech Stack, 2. Strict Modularity (<150 lines), 3. Security & Terminal Protocols, 4. Quality Gate Checklist.'}
Output the complete, functional, ready-to-save file. No placeholders.`;

  if (ai?.sendPrompt) {
    try {
      const res = await ai.sendPrompt(prompt, { model, temperature: 0.1 });
      if (res?.text) {
        return {
          title: ctx.targetFileName || (ctx.targetType === 'rule' ? 'GEMINI.md' : 'SKILL.md'),
          content: res.text,
          folderName: ctx.targetType === 'skill' ? ctx.userPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) : undefined,
          summary: `Tailored ${ctx.targetType} synthesized via Grill-Me clarification.`,
          rationale: 'Directly addresses active git diffs and enforcement standards.'
        };
      }
    } catch {}
  }

  return {
    title: ctx.targetFileName || (ctx.targetType === 'rule' ? 'GEMINI.md' : 'SKILL.md'),
    content: `# TAILORED ${ctx.targetType.toUpperCase()}: ${ctx.userPrompt}\n\n## 1. Scope & Guidelines\n- Workspace: ${ctx.workspaceName || 'Root'}\n- Strict Rule 4: All files <= 150 lines\n- No placeholders allowed\n`,
    folderName: ctx.targetType === 'skill' ? 'custom_skill' : undefined,
    summary: `Fallback ${ctx.targetType} template`,
    rationale: 'Generated from baseline specification'
  };
}
