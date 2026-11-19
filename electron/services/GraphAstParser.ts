import fs from 'fs/promises';
import path from 'path';
import { CodeGraphNode, CodeGraphEdge } from '../../src/types/code-graph';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'build', '.agents', '.vscode', '.idea']);

export class GraphAstParser {
  public static async scanSourceFiles(dir: string, baseDir = dir, depth = 0): Promise<string[]> {
    if (depth > 6) return [];
    let results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (IGNORED_DIRS.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          results = results.concat(await this.scanSourceFiles(full, baseDir, depth + 1));
        } else if (/\.(ts|tsx|js|jsx|py|sql|md)$/i.test(e.name)) {
          results.push(path.relative(baseDir, full).replace(/\\/g, '/'));
        }
      }
    } catch {}
    return results;
  }

  public static parseFileSymbols(relPath: string, content: string, nodes: Record<string, CodeGraphNode>, edges: CodeGraphEdge[]) {
    const fileId = `file:${relPath}`;
    const exportRegex = /export\s+(?:const|function|class|interface|type)\s+([A-Za-z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(content)) !== null) {
      const symName = match[1];
      const symId = `sym:${relPath}:${symName}`;
      nodes[symId] = { id: symId, name: symName, type: 'function', filePath: relPath };
      edges.push({ source: fileId, target: symId, type: 'defines', weight: 1.0 });
    }

    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      edges.push({ source: fileId, target: `import:${match[1]}`, type: 'imports', weight: 0.8 });
    }
  }
}
