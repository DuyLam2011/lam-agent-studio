export interface LeadRemediationOptions {
  workspacePath: string;
  engineSettings: any;
  contextAttachments?: any[];
  activeFilePath?: string;
  userGoal?: string;
  runId?: string;
}

export const generateRemediationForChat = async (
  reviewText: string,
  options: LeadRemediationOptions
) => {
  const prompt = `The Backend Review Specialist reviewed the git repo and reported these findings:\n\n${reviewText}\n\nUser request: "${options.userGoal || 'Remediate issues reported by reviewer'}"\n\nAs Father Agent, remediate the code directly by applying surgical patches ('edit_file' or 'write_file') to resolve the issues. Ensure files remain strictly under 150 lines, types are 100% strict, and verify zero regressions.`;

  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  if (!ai) return null;

  return await ai.sendPrompt(prompt, {
    model: options.engineSettings.selectedModel,
    mode: options.engineSettings.mode,
    persona: options.engineSettings.persona,
    apiKey: options.engineSettings.customApiKey || undefined,
    provider: options.engineSettings.provider,
    baseUrl: options.engineSettings.baseUrl,
    activeFilePath: options.activeFilePath,
    workspacePath: options.workspacePath,
    contextAttachments: options.contextAttachments,
    runId: options.runId
  });
};

export const generateLeadSynthesisForChat = async (
  comboName: string,
  allReviewsText: string,
  options: LeadRemediationOptions
) => {
  const prompt = `You are the Father Agent. Your designated Agent Combo team (${comboName}) evaluated the scope and produced these specialist findings:\n\n${allReviewsText}\n\nUser Prompt: "${options.userGoal || 'Synthesize findings and provide resolution.'}"\n\nProvide an authoritative, executive-first synthesis:\n1. 🛡️ Executive Verdict: State the final conclusion upfront on the first line.\n2. 📑 Inspected Scope: List evaluated files, layers, and components.\n3. 🔍 Synthesis & Key Takeaways: Integrate the specialist inputs (security, backend, UI, QA) into a coherent architectural verdict answering the user's query.\n4. Next Steps: Actionable roadmap or operational recommendations.`;

  const ai = typeof window !== 'undefined' ? (window as any).lamApi?.ai : undefined;
  if (!ai) return null;

  return await ai.sendPrompt(prompt, {
    model: options.engineSettings.selectedModel,
    mode: options.engineSettings.mode,
    persona: options.engineSettings.persona,
    apiKey: options.engineSettings.customApiKey || undefined,
    provider: options.engineSettings.provider,
    baseUrl: options.engineSettings.baseUrl,
    activeFilePath: options.activeFilePath,
    workspacePath: options.workspacePath,
    contextAttachments: options.contextAttachments,
    runId: options.runId
  });
};

export const detectTaggedSubagent = (text: string): string | null => {
  const match = text.match(/@(backend-reviewer|reviewer|log-analyzer|ui-inspector|browser-inspector|browser|subagent-[a-z0-9_-]+)/i);
  if (!match) return null;
  const tag = match[1].toLowerCase();
  if (tag === 'reviewer' || tag === 'backend-reviewer') return 'subagent-backend-reviewer';
  if (tag === 'browser' || tag === 'browser-inspector') return 'subagent-browser-inspector';
  return tag.startsWith('subagent-') ? tag : `subagent-${tag}`;
};