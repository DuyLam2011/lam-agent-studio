import { AgentTools } from '../tools/tools';
import type { SubAgentRole, ToolName, ReviewResult, SubAgentCapsule, ProjectVerificationResult } from '../types';

export type { SubAgentRole, ToolName, ReviewResult, SubAgentCapsule };

export const SUB_AGENT_CAPSULES: Record<SubAgentRole, SubAgentCapsule> = {
  scout: {
    role: 'scout',
    title: 'Codebase Scout (Trinh Sát Mã Nguồn)',
    allowedTools: ['grep_search', 'glob_files', 'read_file_range'],
    systemPrompt: [
      'You are the Codebase Scout. Your sole objective is fast, non-mutating reconnaissance.',
      'Explore directories, find relevant symbols and inspect key line ranges.',
      'Output a concise markdown Context Map listing target files, line numbers, and dependencies.',
      'DO NOT write code or modify files. Deliver grounded file locations and line references.'
    ].join('\n'),
    outputContract: 'Context Map: Target files, critical line ranges, and symbols.'
  },
  architect: {
    role: 'architect',
    title: 'System Architect (Kiến Trúc Sư)',
    allowedTools: ['read_file_range', 'glob_files'],
    systemPrompt: [
      'You are the Principal Architect. Analyze the Scout Context Map and user requirements.',
      'Formulate an Execution Blueprint with exact specifications, interfaces, and invariants.',
      'Strictly enforce Rule 4: all files must remain <= 150 lines.',
      'DO NOT patch files yourself. Provide exact step-by-step instructions for the Engineer.'
    ].join('\n'),
    outputContract: 'Execution Blueprint: Step-by-step modification sequence, interfaces, invariants.'
  },
  engineer: {
    role: 'engineer',
    title: 'Software Engineer (Kỹ Sư Thi Công)',
    allowedTools: ['patch_file', 'run_command'],
    systemPrompt: [
      'You are the Software Engineer. Execute surgical patches based on the Architect Blueprint.',
      'Every patch must replace exact target blocks with zero placeholders.',
      'After every patch, the compiler verification hook (npx tsc --noEmit) will automatically trigger.',
      'If compilation fails, inspect diagnostics and apply immediate fixes until 100% clean.'
    ].join('\n'),
    outputContract: 'Implementation & Verification: Successfully patched files and typecheck status.'
  },
  reviewer: {
    role: 'reviewer',
    title: 'Adversarial Reviewer (Kiểm Định Đối Kháng)',
    allowedTools: ['git_diff', 'read_file_range'],
    systemPrompt: [
      'You are the Adversarial Reviewer. Audit git diff and modified files against requirements.',
      'Inspect for logic bugs, broken invariants, Rule 4 violations (>150 lines), and OWASP risks.',
      'You MUST return strict JSON format: { "status": "APPROVED" | "REJECTED", "issues": ["..."] }.'
    ].join('\n'),
    outputContract: 'Strict JSON { "status": "APPROVED" | "REJECTED", "issues": string[] }'
  }
};

export const enforceToolSecurity = (role: SubAgentRole, toolName: ToolName): void => {
  const capsule = SUB_AGENT_CAPSULES[role];
  if (!capsule.allowedTools.includes(toolName)) {
    throw new Error(
      `[CAPSULE BREACH] Sub-agent '${role}' is forbidden from invoking '${toolName}'. Allowed tools: ${capsule.allowedTools.join(', ')}`
    );
  }
};

export const executePostPatchVerification = async (
  tools: AgentTools,
  customCmd?: string
): Promise<ProjectVerificationResult> => {
  return await tools.verify_project(customCmd || 'npx tsc --noEmit');
};
