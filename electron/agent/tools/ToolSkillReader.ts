import fs from 'fs/promises';
import path from 'path';

export class ToolSkillReader {
  public static async readSkill(workspaceRoot: string, skillName: string): Promise<string> {
    const cleanName = skillName.trim().replace(/^@/, '');
    for (const sub of ['.agents/skills', '.gemini/skills', '.skills', 'skills']) {
      try {
        const skillPath = path.join(workspaceRoot, sub, cleanName, 'SKILL.md');
        const content = await fs.readFile(skillPath, 'utf-8');
        return `[Skill: ${cleanName}]\nPath: ${skillPath}\n\n${content}`;
      } catch {
        try {
          const dir = path.join(workspaceRoot, sub);
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const matched = entries.find((e) =>
            e.isDirectory() && (e.name.toLowerCase() === cleanName.toLowerCase() || e.name.toLowerCase().includes(cleanName.toLowerCase()))
          );
          if (matched) {
            const skillPath = path.join(dir, matched.name, 'SKILL.md');
            const content = await fs.readFile(skillPath, 'utf-8');
            return `[Skill: ${matched.name}]\nPath: ${skillPath}\n\n${content}`;
          }
        } catch {}
      }
    }
    return `Skill "${skillName}" not found in workspace skills directory. Check the active skills list in your system prompt.`;
  }
}
