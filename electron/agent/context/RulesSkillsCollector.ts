import fs from 'fs/promises';
import path from 'path';
import type { AgentPromptOptions } from '../types';

const RULE_FILES = ['GEMINI.md', 'CLAUDE.md', 'AGENTS.md', '.cursorrules', '.rules'];

export class RulesSkillsCollector {
  public static async collectRules(workspace: string, options?: AgentPromptOptions): Promise<string[]> {
    if (options?.rules && options.rules.length > 0) {
      return options.rules.map((r) => `[Rule Scope: ${r.scope.toUpperCase()} | Name: ${r.name}]\n${r.content}`);
    }
    const rules: string[] = [];
    for (const file of RULE_FILES) {
      try {
        const content = await fs.readFile(path.join(workspace, file), 'utf-8');
        rules.push(`[Rule File: ${file}]\n${content.slice(0, 4000)}`);
      } catch { /* absent */ }
    }

    // Automatically scan .agents/rules/*.md
    try {
      const rulesDir = path.join(workspace, '.agents', 'rules');
      const entries = await fs.readdir(rulesDir);
      for (const entry of entries) {
        if (entry.endsWith('.md') || entry.endsWith('.rules')) {
          try {
            const content = await fs.readFile(path.join(rulesDir, entry), 'utf-8');
            rules.push(`[Rule File: .agents/rules/${entry}]\n${content.slice(0, 4000)}`);
          } catch {}
        }
      }
    } catch {}

    return rules;
  }

  public static async collectSkills(workspace: string, options?: AgentPromptOptions): Promise<string[]> {
    if (options?.skills && options.skills.length > 0) {
      return options.skills.map((s) => `[Skill: ${s.name}${s.folderName ? ` (${s.folderName})` : ''}]\nDescription: ${s.description}\nDirectives:\n${s.content.slice(0, 3000)}`);
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
            skills.push(`[Skill: ${e.name}]\n${content.slice(0, 3000)}`);
          } catch {}
        }
      } catch {}
    }
    return skills;
  }
}
