import fs from 'fs/promises';
import path from 'path';
import type { AgentPromptOptions } from '../types';

const RULE_FILES = ['GEMINI.md', 'CLAUDE.md', 'AGENTS.md', '.cursorrules', '.rules'];

export class RulesSkillsCollector {
  public static async collectRules(workspace: string, options?: AgentPromptOptions): Promise<string[]> {
    if (options?.rules && options.rules.length > 0) {
      return options.rules.map((r) => `[Rule Scope: ${r.scope.toUpperCase()} | Name: ${r.name}]\n${r.content.slice(0, 1500)}`);
    }
    const rules: string[] = [];
    for (const file of RULE_FILES) {
      try {
        const content = await fs.readFile(path.join(workspace, file), 'utf-8');
        rules.push(`[Rule File: ${file}]\n${content.slice(0, 1500)}`);
      } catch { /* absent */ }
    }

    try {
      const rulesDir = path.join(workspace, '.agents', 'rules');
      const entries = await fs.readdir(rulesDir);
      for (const entry of entries) {
        if (entry.endsWith('.md') || entry.endsWith('.rules')) {
          try {
            const content = await fs.readFile(path.join(rulesDir, entry), 'utf-8');
            rules.push(`[Rule File: .agents/rules/${entry}]\n${content.slice(0, 1500)}`);
          } catch {}
        }
      }
    } catch {}

    return rules;
  }

  public static async collectSkills(workspace: string, options?: AgentPromptOptions): Promise<string[]> {
    if (options?.skills && options.skills.length > 0) {
      return options.skills.map((s) => `[Available Skill: ${s.name}${s.folderName ? ` (${s.folderName})` : ''}] ${s.description || s.content.slice(0, 200).replace(/\r?\n+/g, ' ')}`);
    }
    const skills: string[] = [];
    for (const sub of ['.agents/skills', '.gemini/skills', '.skills', 'skills']) {
      try {
        const dir = path.join(workspace, sub);
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isDirectory()) continue;
          try {
            const content = await fs.readFile(path.join(dir, e.name, 'SKILL.md'), 'utf-8');
            const summary = content.slice(0, 250).replace(/\r?\n+/g, ' ').replace(/^#*\s*/, '').trim();
            skills.push(`[Available Skill: ${e.name}] ${summary}`);
          } catch {}
        }
      } catch {}
    }
    return skills;
  }
}
