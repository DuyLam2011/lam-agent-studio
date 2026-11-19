import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { app, shell } from 'electron';
import { ProjectMemoryItem, MemoryCategory, MemoryFolderTreeNode } from '../../src/types/memory';
import { MemoryMarkdownSerializer } from './MemoryMarkdownSerializer';

export class MemoryStorageService {
  private globalDir: string;
  private readonly CATEGORIES: MemoryCategory[] = ['decision', 'architecture', 'convention', 'gotcha', 'glossary'];

  constructor() {
    const userData = app?.getPath ? app.getPath('userData') : (process.env.APPDATA || process.cwd());
    this.globalDir = path.join(userData, 'agents', 'memory');
  }

  private getWsMemoryDir(workspacePath: string): string {
    return path.join(workspacePath, '.agents', 'memory');
  }

  private async ensureCategoryDirs(baseDir: string): Promise<void> {
    await fs.mkdir(baseDir, { recursive: true });
    for (const cat of this.CATEGORIES) {
      await fs.mkdir(path.join(baseDir, `${cat}s`), { recursive: true });
    }
  }

  public async loadMemories(workspacePath?: string): Promise<{ global: ProjectMemoryItem[]; workspace: ProjectMemoryItem[] }> {
    const global = await this.readMemoryDirectory(this.globalDir, 'global');
    let workspace: ProjectMemoryItem[] = [];

    if (workspacePath) {
      const wsDir = this.getWsMemoryDir(workspacePath);
      const indexFile = path.join(wsDir, 'index.json');
      if (fsSync.existsSync(indexFile)) {
        workspace = await this.readMemoryDirectory(wsDir, 'workspace');
      } else {
        // Fallback / auto-migration from legacy .lam/memories.json
        const legacyFile = path.join(workspacePath, '.lam', 'memories.json');
        if (fsSync.existsSync(legacyFile)) {
          try {
            const raw = JSON.parse(await fs.readFile(legacyFile, 'utf-8'));
            if (Array.isArray(raw) && raw.length > 0) {
              await this.saveMemories(raw, workspacePath);
              workspace = raw;
            }
          } catch {}
        }
      }
    }
    return { global, workspace };
  }

  private async readMemoryDirectory(dir: string, scope: 'global' | 'workspace'): Promise<ProjectMemoryItem[]> {
    const indexFile = path.join(dir, 'index.json');
    if (!fsSync.existsSync(indexFile)) return [];
    try {
      const items: ProjectMemoryItem[] = JSON.parse(await fs.readFile(indexFile, 'utf-8'));
      return items.map((it) => ({ ...it, scope: it.scope || scope }));
    } catch { return []; }
  }

  public async saveMemories(memories: ProjectMemoryItem[], workspacePath?: string): Promise<void> {
    const globalItems = memories.filter((m) => m.scope !== 'workspace');
    await this.persistItems(this.globalDir, globalItems);

    if (workspacePath) {
      const wsItems = memories.filter((m) => m.scope === 'workspace');
      const wsDir = this.getWsMemoryDir(workspacePath);
      await this.persistItems(wsDir, wsItems);

      // Backward compatibility mirror to .lam/memories.json
      try {
        const legacyDir = path.join(workspacePath, '.lam');
        await fs.mkdir(legacyDir, { recursive: true });
        await fs.writeFile(path.join(legacyDir, 'memories.json'), JSON.stringify(wsItems, null, 2), 'utf-8');
      } catch {}
    }
  }

  private async persistItems(dir: string, items: ProjectMemoryItem[]): Promise<void> {
    await this.ensureCategoryDirs(dir);
    const enriched: ProjectMemoryItem[] = [];

    for (const item of items) {
      const catFolder = `${item.category}s`;
      const slug = MemoryMarkdownSerializer.slugify(item.title);
      const relPath = path.join(catFolder, `${slug}.md`).replace(/\\/g, '/');
      const fullPath = path.join(dir, relPath);
      const enrichedItem = { ...item, filePath: relPath, updatedAt: Date.now() };

      const mdContent = MemoryMarkdownSerializer.serialize(enrichedItem);
      await fs.writeFile(fullPath, mdContent, 'utf-8');
      enriched.push(enrichedItem);
    }

    await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(enriched, null, 2), 'utf-8');
  }

  public async getFolderTree(workspacePath?: string): Promise<MemoryFolderTreeNode> {
    const targetDir = workspacePath ? this.getWsMemoryDir(workspacePath) : this.globalDir;
    const rootName = workspacePath ? '.agents/memory' : '~/.lam/memory';
    const rootNode: MemoryFolderTreeNode = { name: rootName, relativePath: '', isDirectory: true, children: [] };

    if (!fsSync.existsSync(targetDir)) return rootNode;

    for (const cat of this.CATEGORIES) {
      const catDir = path.join(targetDir, `${cat}s`);
      const catNode: MemoryFolderTreeNode = { name: `${cat}s`, relativePath: `${cat}s`, isDirectory: true, category: cat, children: [] };
      if (fsSync.existsSync(catDir)) {
        const files = await fs.readdir(catDir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const stat = await fs.stat(path.join(catDir, file)).catch(() => null);
            catNode.children?.push({
              name: file, relativePath: `${cat}s/${file}`, isDirectory: false,
              size: stat?.size || 0, category: cat
            });
          }
        }
      }
      catNode.itemCount = catNode.children?.length || 0;
      rootNode.children?.push(catNode);
    }

    const graphDir = path.join(workspacePath || '', '.agents', 'graph');
    if (workspacePath && fsSync.existsSync(graphDir)) {
      const graphNode: MemoryFolderTreeNode = { name: 'graph', relativePath: '../graph', isDirectory: true, children: [] };
      const gFiles = await fs.readdir(graphDir).catch(() => []);
      for (const gf of gFiles) {
        const stat = await fs.stat(path.join(graphDir, gf)).catch(() => null);
        graphNode.children?.push({ name: gf, relativePath: `../graph/${gf}`, isDirectory: false, size: stat?.size || 0 });
      }
      rootNode.children?.push(graphNode);
    }

    return rootNode;
  }

  public async openMemoryFile(workspacePath: string, relativePath: string): Promise<boolean> {
    const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(this.getWsMemoryDir(workspacePath), relativePath);
    if (!fsSync.existsSync(fullPath)) return false;
    await shell.openPath(fullPath);
    return true;
  }
}

export const memoryStorageService = new MemoryStorageService();
