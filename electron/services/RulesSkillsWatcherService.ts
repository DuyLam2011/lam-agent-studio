import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

interface CachedEntry {
  content: string;
  timestamp: number;
}

export class RulesSkillsWatcherService {
  private static rulesCache: Map<string, CachedEntry> = new Map();
  private static skillsCache: Map<string, CachedEntry> = new Map();
  private static watchers: Map<string, fsSync.FSWatcher[]> = new Map();
  private static debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  public static async getCompiledRules(workspace: string): Promise<string[]> {
    const cached = this.rulesCache.get(workspace);
    if (cached && Date.now() - cached.timestamp < 30_000) {
      return JSON.parse(cached.content);
    }

    const rules = await this.readRulesFromDisk(workspace);
    this.rulesCache.set(workspace, { content: JSON.stringify(rules), timestamp: Date.now() });
    this.ensureWorkspaceWatchers(workspace);
    return rules;
  }

  public static async getCompiledSkills(workspace: string): Promise<string[]> {
    const cached = this.skillsCache.get(workspace);
    if (cached && Date.now() - cached.timestamp < 30_000) {
      return JSON.parse(cached.content);
    }

    const skills = await this.readSkillsFromDisk(workspace);
    this.skillsCache.set(workspace, { content: JSON.stringify(skills), timestamp: Date.now() });
    this.ensureWorkspaceWatchers(workspace);
    return skills;
  }

  private static async readRulesFromDisk(workspace: string): Promise<string[]> {
    const ruleFiles = ['GEMINI.md', 'CLAUDE.md', 'AGENTS.md', '.cursorrules', '.rules', 'RULES.md'];
    const rules: string[] = [];

    for (const file of ruleFiles) {
      try {
        const fullPath = path.join(workspace, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        rules.push(`[Rule File: ${file}]\n${content.slice(0, 1500)}`);
      } catch {}
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

  private static async readSkillsFromDisk(workspace: string): Promise<string[]> {
    const skills: string[] = [];
    const dirs = ['.agents/skills', '.gemini/skills', '.skills', 'skills'];

    for (const sub of dirs) {
      try {
        const dir = path.join(workspace, sub);
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isDirectory()) continue;
          try {
            const skillPath = path.join(dir, e.name, 'SKILL.md');
            const content = await fs.readFile(skillPath, 'utf-8');
            const summary = content.slice(0, 250).replace(/\r?\n+/g, ' ').replace(/^#*\s*/, '').trim();
            skills.push(`[Skill: ${e.name}] ${summary}`);
          } catch {}
        }
      } catch {}
    }
    return skills;
  }

  private static ensureWorkspaceWatchers(workspace: string) {
    if (this.watchers.has(workspace)) return;
    const activeWatchers: fsSync.FSWatcher[] = [];

    const watchPath = (target: string) => {
      try {
        if (fsSync.existsSync(target)) {
          const w = fsSync.watch(target, { recursive: true }, () => {
            const key = `debounce-${workspace}`;
            const existing = this.debounceTimers.get(key);
            if (existing) clearTimeout(existing);

            const timer = setTimeout(() => {
              this.rulesCache.delete(workspace);
              this.skillsCache.delete(workspace);
            }, 300);
            this.debounceTimers.set(key, timer);
          });
          activeWatchers.push(w);
        }
      } catch {}
    };

    watchPath(workspace);
    watchPath(path.join(workspace, '.agents'));
    this.watchers.set(workspace, activeWatchers);
  }

  public static clearWorkspaceWatchers(workspace?: string) {
    if (workspace) {
      const list = this.watchers.get(workspace) || [];
      list.forEach((w) => w.close());
      this.watchers.delete(workspace);
      this.rulesCache.delete(workspace);
      this.skillsCache.delete(workspace);
    } else {
      for (const list of this.watchers.values()) list.forEach((w) => w.close());
      this.watchers.clear();
      this.rulesCache.clear();
      this.skillsCache.clear();
    }
  }
}
