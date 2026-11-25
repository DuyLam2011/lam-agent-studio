import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import https from 'https';
import { NativeEngineBridge } from './NativeEngineBridge';

export interface DocReadOptions {
  url?: string;
  path?: string;
  query?: string;
  maxTokens?: number;
}

export class DocReaderService {
  public static async readDoc(workspaceRoot: string, options: DocReadOptions): Promise<string> {
    const query = options.query?.trim();
    if (options.url) {
      return this.readWebDoc(options.url, query);
    }
    if (options.path) {
      return this.readLocalDoc(workspaceRoot, options.path, query);
    }
    throw new Error('Either "url" or "path" must be provided to read_doc.');
  }

  private static async readLocalDoc(workspaceRoot: string, relPath: string, query?: string): Promise<string> {
    const full = path.isAbsolute(relPath) ? relPath : path.resolve(workspaceRoot, relPath);
    const content = await fs.readFile(full, 'utf-8');
    const filtered = query ? this.filterByQuery(content, query) : content;
    const estTokens = Math.round(filtered.length / 4);
    return [
      `[📖 Doc Reader: Local File | Path: ${relPath} | ~${estTokens} tokens | Filter: ${query || 'all'}]`,
      filtered
    ].join('\n\n');
  }

  private static async readWebDoc(urlStr: string, query?: string): Promise<string> {
    const html = await this.fetchHtml(urlStr);
    if (NativeEngineBridge.isNativeAvailable()) {
      const nativeClean = NativeEngineBridge.cleanHtmlToMarkdown(html, query);
      if (nativeClean) {
        return [
          `[📖 Doc Reader: "${nativeClean.title}" | URL: ${urlStr} | ~${nativeClean.estimatedTokens} tokens | Filter: ${query || 'all'}]`,
          nativeClean.markdown
        ].join('\n\n');
      }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : urlStr;
    const cleanMd = this.htmlToCleanMarkdown(html);
    const filtered = query ? this.filterByQuery(cleanMd, query) : cleanMd;
    const estTokens = Math.round(filtered.length / 4);
    return [
      `[📖 Doc Reader: "${title}" | URL: ${urlStr} | ~${estTokens} tokens | Filter: ${query || 'all'}]`,
      filtered
    ].join('\n\n');
  }

  private static filterByQuery(text: string, query: string): string {
    const lowerQ = query.toLowerCase();
    const blocks = text.split(/\n{2,}/);
    const matched = blocks.filter(b => b.toLowerCase().includes(lowerQ));
    if (matched.length === 0) {
      return `[Query "${query}" not found in document. First 300 words preview:]\n\n` + blocks.slice(0, 3).join('\n\n');
    }
    return matched.join('\n\n');
  }

  private static htmlToCleanMarkdown(html: string): string {
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<(header|footer|nav|aside|iframe)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

    clean = clean.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => `\n\`\`\`\n${code.trim()}\n\`\`\`\n`);
    clean = clean.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => `\`${code.trim()}\``);
    clean = clean.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl, h) => `\n${'#'.repeat(Number(lvl))} ${h.replace(/<[^>]+>/g, '').trim()}\n`);
    clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${item.replace(/<[^>]+>/g, '').trim()}`);
    clean = clean.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${text.replace(/<[^>]+>/g, '').trim()}](${href})`);
    clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, p) => `\n\n${p.replace(/<[^>]+>/g, '').trim()}\n\n`);
    clean = clean.replace(/<[^>]+>/g, ' ');
    return clean.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  private static fetchHtml(urlStr: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = urlStr.startsWith('https') ? https : http;
      const req = client.get(urlStr, { timeout: 6000, headers: { 'User-Agent': 'LAM-Agent-Studio/1.0 (Analytic Doc Reader)' } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.fetchHtml(res.headers.location));
        }
        let body = '';
        res.on('data', chunk => {
          body += chunk;
          if (body.length > 1_000_000) req.destroy();
        });
        res.on('end', () => resolve(body));
      });
      req.on('error', err => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout reading doc from ${urlStr}`)); });
    });
  }
}
