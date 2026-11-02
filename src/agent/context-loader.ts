import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export class ContextLoader {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
  }

  public async loadWorkspaceSpecs(): Promise<string> {
    const sections: string[] = ['### WORKSPACE RULES & SPECS'];

    // 1. Package overview & dependencies
    const pkgPath = path.join(this.workspaceRoot, 'package.json');
    if (fsSync.existsSync(pkgPath)) {
      try {
        const raw = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw);
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});
        const scripts = Object.keys(pkg.scripts || {});

        sections.push(
          '#### Project Identity & Dependencies',
          `- Package: ${pkg.name || 'unnamed'}@${pkg.version || '0.0.0'}`,
          `- Scripts: ${scripts.join(', ') || 'none'}`,
          `- Dependencies (${deps.length}): ${deps.slice(0, 30).join(', ') || 'none'}`,
          `- DevDependencies (${devDeps.length}): ${devDeps.slice(0, 20).join(', ') || 'none'}`
        );
      } catch {
        // Skip unparseable package.json
      }
    }

    // 2. Core project instructions (GEMINI.md / CLAUDE.md / AGENTS.md)
    const specFiles = ['GEMINI.md', 'CLAUDE.md', 'AGENTS.md'];
    for (const specFile of specFiles) {
      const fullPath = path.join(this.workspaceRoot, specFile);
      if (fsSync.existsSync(fullPath)) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const trimmed = content.length > 8000 ? `${content.slice(0, 8000)}\n... [Truncated for token limit]` : content;
          sections.push(`\n#### Specification File: ${specFile}\n${trimmed.trim()}`);
        } catch {
          // Skip unreadable file
        }
      }
    }

    // 3. Cursor rules (.cursorrules)
    const cursorRulesPath = path.join(this.workspaceRoot, '.cursorrules');
    if (fsSync.existsSync(cursorRulesPath)) {
      try {
        const rules = await fs.readFile(cursorRulesPath, 'utf-8');
        sections.push(`\n#### Cursor Rules (.cursorrules)\n${rules.trim()}`);
      } catch {
        // Skip
      }
    }

    // 4. Subagent & workspace rule files (.agents/rules/*.md)
    const rulesDir = path.join(this.workspaceRoot, '.agents', 'rules');
    if (fsSync.existsSync(rulesDir)) {
      try {
        const files = await fs.readdir(rulesDir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const rulePath = path.join(rulesDir, file);
            const content = await fs.readFile(rulePath, 'utf-8');
            sections.push(`\n#### Rule (${file})\n${content.trim()}`);
          }
        }
      } catch {
        // Skip unreadable rules dir
      }
    }

    return sections.join('\n');
  }

  public async injectSystemInstruction(baseSystemPrompt: string): Promise<string> {
    const specs = await this.loadWorkspaceSpecs();
    return `${baseSystemPrompt}\n\n${specs}`;
  }
}
