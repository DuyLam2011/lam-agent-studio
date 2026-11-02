import { SkillQualityReport, SkillDryRunResult } from '../../types/skill-studio';

export const parseSkillFrontmatter = (content: string) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content.trim() };
  const rawYaml = match[1];
  const body = match[2].trim();
  const nameMatch = rawYaml.match(/name:\s*([^\r\n]+)/i);
  const descMatch = rawYaml.match(/description:\s*([^\r\n]+)/i);
  return {
    frontmatter: {
      name: nameMatch ? nameMatch[1].trim() : '',
      description: descMatch ? descMatch[1].trim() : ''
    },
    body
  };
};

export const serializeSkillMarkdown = (name: string, description: string, bodyContent: string): string => {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
  const cleanDesc = description.trim();
  let cleanBody = bodyContent.trim();
  if (cleanBody.startsWith('---')) {
    const parsed = parseSkillFrontmatter(cleanBody);
    cleanBody = parsed.body;
  }
  return `---\nname: ${cleanName}\ndescription: ${cleanDesc}\n---\n\n${cleanBody}\n`;
};

export const validateSkillQuality = (content: string, name: string, description: string): SkillQualityReport => {
  const parsed = parseSkillFrontmatter(content);
  const isFrontmatterValid = Boolean(parsed.frontmatter && parsed.frontmatter.name);
  const effDesc = description || parsed.frontmatter?.description || '';
  const effName = name || parsed.frontmatter?.name || '';
  
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const isUnderWordLimit = wordCount <= 500;
  const estimatedTokens = Math.max(15, Math.ceil(content.length / 3.8));

  const hasClearTrigger = /trigger|when|invoke|use this skill|on "|command|\/|call this/i.test(effDesc);
  const hasVerificationStep = /verify|test|assert|confirm|compile|tsc|exit code|regression/i.test(content);
  const hasSafetyConstraint = /safety|guard|permission|never|strict|sanitize|read-only|owasp/i.test(content);

  const recommendations: string[] = [];
  let score = 100;

  if (!isFrontmatterValid) {
    score -= 25;
    recommendations.push('Thiếu hoặc sai cú pháp YAML frontmatter (cần `name:` và `description:`).');
  }
  if (!hasClearTrigger) {
    score -= 20;
    recommendations.push('Mô tả (description) cần có từ khóa kích hoạt rõ ràng (ví dụ: "Trigger on /review or review code").');
  }
  if (!isUnderWordLimit) {
    score -= 15;
    recommendations.push(`Nội dung dài ${wordCount} từ (>500 từ). Hãy bóc tách chi tiết sang thư mục 'references/' để tối ưu context.`);
  }
  if (!hasVerificationStep) {
    score -= 15;
    recommendations.push('Nên bổ sung bước Verification (Kiểm thử, biên dịch hoặc xác thực kết quả).');
  }
  if (!hasSafetyConstraint) {
    score -= 10;
    recommendations.push('Nên bổ sung ràng buộc an toàn (Safety constraints hoặc guardrails).');
  }

  return {
    score: Math.max(10, score),
    isFrontmatterValid,
    hasClearTrigger,
    wordCount,
    isUnderWordLimit,
    estimatedTokens,
    hasVerificationStep,
    hasSafetyConstraint,
    parsedName: effName,
    parsedDescription: effDesc,
    recommendations
  };
};

export const simulateSkillRouting = (
  skill: { name: string; description: string; content: string },
  userPrompt: string
): SkillDryRunResult => {
  const combined = `${skill.name} ${skill.description} ${skill.content}`.toLowerCase();
  const promptLower = userPrompt.toLowerCase();
  const promptTokens = promptLower.split(/[\s,.;:!?`"'/()]+/).filter(w => w.length >= 3);

  const matchedKeywords: string[] = [];
  for (const token of promptTokens) {
    if (combined.includes(token) && !matchedKeywords.includes(token)) {
      matchedKeywords.push(token);
    }
  }

  const confidence = Math.min(100, Math.round((matchedKeywords.length / Math.max(3, promptTokens.length)) * 120));
  const status = confidence >= 50 ? 'pass' : confidence >= 25 ? 'warning' : 'fail';
  const diagnosticNotes: string[] = [];

  if (status === 'pass') {
    diagnosticNotes.push(`Khớp chính xác với ${matchedKeywords.length} từ khóa kích hoạt: ${matchedKeywords.slice(0, 4).join(', ')}.`);
  } else if (status === 'warning') {
    diagnosticNotes.push(`Độ khớp trung bình (${confidence}%). Khuyến khích bổ sung từ khóa vào description.`);
  } else {
    diagnosticNotes.push(`Không tìm thấy từ khóa kích hoạt tương thích trong prompt người dùng.`);
  }

  return {
    skillId: skill.name,
    skillName: skill.name,
    matchedKeywords,
    routingConfidence: confidence,
    simulatedSystemContext: `### ACTIVE SKILL DIRECTIVE: ${skill.name}\n${skill.content.slice(0, 300)}...`,
    estimatedTokens: Math.ceil(skill.content.length / 3.8),
    status,
    diagnosticNotes
  };
};
