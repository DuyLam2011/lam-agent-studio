import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import { contextBatchEngine } from '../../services/ContextBatchEngine';
import { RulesSkillsCollector } from './RulesSkillsCollector';
import type { AgentPromptOptions } from '../types';

const FILE_CHAR_LIMIT = 30_000;
/** Character budget shared by the active file and all attachments (estimate, not tokens). */
const ATTACHMENT_BUDGET = 120_000;

const fence = (content: string) => `\`\`\`\n${content}\n\`\`\``;
const section = (title: string, items: string[]) => (items.length > 0 ? `\n${title}:\n${items.join('\n\n')}` : '');

const readAttachment = async (workspace: string, att: NonNullable<AgentPromptOptions['contextAttachments']>[number]): Promise<string | null> => {
  if (att.snippet) {
    if (att.type === 'folder') return `[Attached Folder Context: ${att.name}]\nPath: ${att.path}\n${att.snippet}`;
    const range = att.lineRange ? ` (Lines ${att.lineRange.startLine}-${att.lineRange.endLine})` : '';
    return `[Attached Context: ${att.name}${range}]\nPath: ${att.path}\n${fence(att.snippet)}`;
  }
  if (!att.path) return null;
  try {
    const target = path.isAbsolute(att.path) ? att.path : path.join(workspace, att.path);
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(target);
      const preview = entries.filter((e) => !e.startsWith('.')).slice(0, 40);
      return `[Attached Folder Context: ${att.name}]\nPath: ${target}\nContained Entries (${entries.length}):\n${preview.map((e) => `- ${e}`).join('\n')}`;
    }
    const content = await fs.readFile(target, 'utf-8');
    return `[Attached File Context: ${att.name}]\nRelative Path: ${path.relative(workspace, target)}\nAbsolute Path: ${target}\n${fence(content.slice(0, FILE_CHAR_LIMIT))}`;
  } catch {
    return null;
  }
};

const readActiveFile = async (workspace: string, activeFilePath?: string): Promise<string> => {
  if (!activeFilePath) return '';
  try {
    const target = path.isAbsolute(activeFilePath) ? activeFilePath : path.join(workspace, activeFilePath);
    const content = await fs.readFile(target, 'utf-8');
    return `\n[Currently Active Editor File: ${path.basename(target)}]\nRelative Path: ${path.relative(workspace, target)}\nAbsolute Path: ${target}\nFull File Content:\n${fence(content.slice(0, FILE_CHAR_LIMIT))}`;
  } catch (err: any) {
    console.warn(`Could not read active file ${activeFilePath}:`, err.message);
    return '';
  }
};

const readGitSummary = async (workspace: string): Promise<string> => {
  try {
    const git = simpleGit(workspace);
    if (!(await git.checkIsRepo())) return '';
    const status = await git.status();
    if (status.files.length === 0) return `\n[Git Working Tree Status]: Branch: ${status.current}, clean.`;
    return `\n[Git Working Tree Status]: Branch: ${status.current}, Modified: [${status.modified.slice(0, 30).join(', ')}], Staged: [${status.staged.slice(0, 30).join(', ')}], Untracked: [${status.not_added.slice(0, 10).join(', ')}]`;
  } catch {
    return '';
  }
};

/**
 * Assemble the workspace context block placed in the system instruction:
 * environment, scoped rules/skills/workflows, memories, git state, and
 * explicitly attached files (bounded by a shared character budget).
 */
export const assembleContext = async (workspace: string, activeFilePath?: string, options?: AgentPromptOptions): Promise<string> => {
  const [rules, skills, activeFileContext, gitSummary, batch] = await Promise.all([
    RulesSkillsCollector.collectRules(workspace, options),
    RulesSkillsCollector.collectSkills(workspace, options),
    readActiveFile(workspace, activeFilePath),
    readGitSummary(workspace),
    contextBatchEngine.getUnifiedBatch(workspace).catch(() => null)
  ]);

  let budget = ATTACHMENT_BUDGET - activeFileContext.length;
  const attachments: string[] = [];
  for (const att of options?.contextAttachments || []) {
    const block = await readAttachment(workspace, att);
    if (!block) continue;
    if (block.length > budget) {
      attachments.push(`[Attached Context: ${att.name}] omitted — context budget exhausted. Use read_file to inspect it.`);
      continue;
    }
    budget -= block.length;
    attachments.push(block);
  }

  const workflows = (options?.workflows || []).map((wf) =>
    `[Workflow: ${wf.name}]\n${wf.description}\nSteps:\n${wf.steps.map((st: any, i: number) => `${i + 1}. [${st.role}] ${st.name}: ${st.instructions}`).join('\n')}`
  );
  const plugins = (options?.plugins || []).map((pl) => `[Plugin / MCP: ${pl.name}]\n${pl.description}\nTools: ${pl.toolsExposed.join(', ')}`);
  const subagents = (options?.subagents || []).map((sa) => `[Subagent Role: ${sa.name} (${sa.role})]\nDirective: ${sa.systemPrompt.slice(0, 600)}`);
  const memories = (options?.memories || []).map((m) => `[Memory: ${m.title} (${m.category})]\n${m.content}`);

  const osName = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
  const repoScopeInfo = options?.activeRepo ? [
    `\n[Active Multi-Repo Scope]`,
    `Target Active Repository: ${options.activeRepo.name} (${options.activeRepo.tag})`,
    `Target Repository Root: ${options.activeRepo.root}`,
    options.activeRepo.availableRepos && options.activeRepo.availableRepos.length > 1
      ? `Workspace Repositories (${options.activeRepo.availableRepos.length}): ${options.activeRepo.availableRepos.map((r) => r.name === options.activeRepo?.name ? `${r.name} [ACTIVE FOCUS]` : r.name).join(', ')}`
      : '',
    `CRITICAL REPO ISOLATION: All file mutations ('write_file', 'edit_file') and reads MUST strictly target active repository '${options.activeRepo.name}'. Never create or write files into sibling repositories.`
  ].filter(Boolean).join('\n') : '';

  return [
    `Workspace Directory: ${workspace}`,
    repoScopeInfo,
    options?.advisory ? `\n[Architectural Advisory & Capabilities Optimization]\n${options.advisory.advisoryMarkdown || ''}` : '',
    `Operating System: ${osName}`,
    'Environment: Desktop Agent Studio IDE',
    batch ? `\n${batch.distilledContext}\n` : '',
    gitSummary,
    section('Explicit Attached User Context', attachments),
    section('Active Scoped Rules', rules),
    section('Active Scoped Skills (Use "read_skill" to inspect full instructions)', skills),
    section('Autonomous Workflows', workflows),
    section('Connected Plugins & MCP', plugins),
    section('Available Subagent Roles', subagents),
    section('Project Memory & Decisions', memories),
    activeFileContext
  ].filter(Boolean).join('\n');
};
