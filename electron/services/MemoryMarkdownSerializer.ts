import { ProjectMemoryItem, MemoryCategory, MemoryStatus } from '../../src/types/memory';

export class MemoryMarkdownSerializer {
  public static slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 50) || 'memory';
  }

  public static serialize(item: ProjectMemoryItem): string {
    const frontmatter = [
      '---',
      `id: "${item.id}"`,
      `title: "${item.title.replace(/"/g, '\\"')}"`,
      `category: "${item.category}"`,
      `scope: "${item.scope}"`,
      `status: "${item.status || 'accepted'}"`,
      `pinned: ${item.pinned ? 'true' : 'false'}`,
      `updatedAt: ${item.updatedAt || Date.now()}`,
      item.tags && item.tags.length ? `tags: [${item.tags.map(t => `"${t}"`).join(', ')}]` : null,
      '---',
      ''
    ].filter(Boolean).join('\n');

    const body = [
      `# ${item.title}`,
      '',
      `> **Category:** \`${item.category.toUpperCase()}\` | **Scope:** \`${item.scope.toUpperCase()}\` | **Status:** \`${(item.status || 'accepted').toUpperCase()}\``,
      '',
      '## Directive & Context',
      item.content,
      ''
    ].join('\n');

    return `${frontmatter}\n${body}`;
  }

  public static parse(content: string, fallbackId: string, relPath: string): ProjectMemoryItem {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    const meta: Record<string, any> = {};
    let rawBody = content;

    if (fmMatch) {
      rawBody = content.slice(fmMatch[0].length);
      const lines = fmMatch[1].split('\n');
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
          meta[key] = val;
        }
      }
    }

    const titleMatch = rawBody.match(/^#\s+(.+)$/m);
    const title = meta.title || (titleMatch ? titleMatch[1].trim() : 'Untitled Memory');
    const cleanContent = rawBody.replace(/^#\s+.+$/m, '').replace(/^>\s+.*$/m, '').replace(/^##\s+.*$/m, '').trim();

    return {
      id: meta.id || fallbackId,
      title,
      category: (meta.category as MemoryCategory) || 'decision',
      content: cleanContent || title,
      scope: (meta.scope as any) || 'workspace',
      status: (meta.status as MemoryStatus) || 'accepted',
      pinned: meta.pinned !== 'false',
      updatedAt: Number(meta.updatedAt) || Date.now(),
      filePath: relPath
    };
  }
}
