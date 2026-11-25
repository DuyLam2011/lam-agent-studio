import fs from 'fs/promises';
import path from 'path';
import ignore, { Ignore } from 'ignore';
import { NativeEngineBridge } from '../../services/NativeEngineBridge';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'build', 'release', 'out', 'coverage', '.next', '.turbo', '.cache', 'target']);
const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|bmp|pdf|zip|gz|7z|rar|exe|dll|so|dylib|bin|pak|dat|woff2?|ttf|otf|eot|mp[34]|mov|avi|wasm|asar|lock)$/i;
const MAX_FILE_BYTES = 1_000_000;
const TIME_BUDGET_MS = 6_000;

export interface SearchOptions {
  root: string;
  query: string;
  isRegex?: boolean;
  maxResults?: number;
  signal?: AbortSignal;
}

const loadGitignore = async (root: string): Promise<Ignore> => {
  const ig = ignore();
  try {
    ig.add(await fs.readFile(path.join(root, '.gitignore'), 'utf-8'));
  } catch { /* no .gitignore */ }
  return ig;
};

export const searchWorkspace = async ({ root, query, isRegex, maxResults = 80, signal }: SearchOptions): Promise<string> => {
  if (!query) throw new Error('query is required');

  // Fast path: Native Rust Multi-threaded Parallel Search
  if (NativeEngineBridge.isNativeAvailable()) {
    const fastRes = NativeEngineBridge.searchWorkspace(root, query, Boolean(isRegex), maxResults, Array.from(SKIP_DIRS));
    if (fastRes) {
      if (fastRes.matches.length === 0) {
        return `No matches for "${query}" (${fastRes.filesScanned} files scanned in ${fastRes.durationMs.toFixed(1)}ms).`;
      }
      const note = fastRes.truncated ? `\n[Result limit reached after ${fastRes.filesScanned} files]` : '';
      const lines = fastRes.matches.map(m => `${m.filePath}:${m.lineContent}`);
      return `${fastRes.matches.length} matches in ${fastRes.filesScanned} files (${fastRes.durationMs.toFixed(1)}ms via Rust engine):\n${lines.join('\n')}${note}`;
    }
  }

  // TypeScript Fallback Path
  let matcher: RegExp;
  try {
    matcher = isRegex ? new RegExp(query, 'i') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  } catch (err: any) {
    throw new Error(`Invalid regular expression: ${err.message}`);
  }

  const limit = Math.min(Math.max(1, maxResults), 300);
  const ig = await loadGitignore(root);
  const deadline = Date.now() + TIME_BUDGET_MS;
  const matches: string[] = [];
  let filesScanned = 0;
  let truncated = false;

  const walk = async (dir: string): Promise<void> => {
    if (matches.length >= limit || Date.now() > deadline || signal?.aborted) { truncated = true; return; }
    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch { return; }

    for (const entry of entries) {
      if (matches.length >= limit || Date.now() > deadline || signal?.aborted) { truncated = true; return; }
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || ig.ignores(`${rel}/`)) continue;
        await walk(full);
        continue;
      }
      if (!entry.isFile() || BINARY_EXT.test(entry.name) || ig.ignores(rel)) continue;
      try {
        const stat = await fs.stat(full);
        if (stat.size > MAX_FILE_BYTES) continue;
        const content = await fs.readFile(full, 'utf-8');
        filesScanned++;
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          if (!matcher.test(lines[i])) continue;
          matches.push(`${rel}:${i + 1}: ${lines[i].trim().slice(0, 240)}`);
          if (matches.length >= limit) { truncated = true; break; }
        }
      } catch { /* unreadable file */ }
    }
  };

  await walk(root);
  if (matches.length === 0) return `No matches for "${query}" (${filesScanned} files scanned).`;
  const note = truncated ? `\n[Result limit or time budget reached after ${filesScanned} files — refine the query or path.]` : '';
  return `${matches.length} matches in ${filesScanned} files:\n${matches.join('\n')}${note}`;
};
