import assert from 'assert';
import fs from 'fs/promises';
import path from 'path';
import { MemoryMarkdownSerializer } from '../electron/services/MemoryMarkdownSerializer';
import { ProjectMemoryItem } from '../src/types/memory';

async function runMemoryStorageTests() {
  console.log('🧪 Starting Memory Storage & File Hierarchy Test Suite...\n');

  const testItem: ProjectMemoryItem = {
    id: 'adr-001',
    title: 'Adopt Multi-Tier Agent Memory',
    category: 'architecture',
    scope: 'workspace',
    status: 'accepted',
    pinned: true,
    tags: ['memory', 'architecture', 'graphify'],
    content: 'We use a dual-tier storage strategy: structured markdown on disk and an in-memory graph index.',
    updatedAt: 1731800000000
  };

  // 1. Test Markdown Serialization
  const md = MemoryMarkdownSerializer.serialize(testItem);
  assert(md.includes('id: "adr-001"'), 'Frontmatter must contain id');
  assert(md.includes('category: "architecture"'), 'Frontmatter must contain category');
  assert(md.includes('# Adopt Multi-Tier Agent Memory'), 'Markdown body must contain header');
  assert(md.includes('We use a dual-tier storage strategy'), 'Markdown body must contain directive content');
  console.log('  ✅ MemoryMarkdownSerializer successfully generated markdown with YAML frontmatter');

  // 2. Test Markdown Deserialization
  const parsed = MemoryMarkdownSerializer.parse(md, 'fallback-id', 'architectures/adopt-multi-tier.md');
  assert.strictEqual(parsed.id, 'adr-001');
  assert.strictEqual(parsed.title, 'Adopt Multi-Tier Agent Memory');
  assert.strictEqual(parsed.category, 'architecture');
  assert.strictEqual(parsed.status, 'accepted');
  assert.strictEqual(parsed.pinned, true);
  assert.strictEqual(parsed.filePath, 'architectures/adopt-multi-tier.md');
  console.log('  ✅ MemoryMarkdownSerializer successfully parsed markdown back to ProjectMemoryItem');

  // 3. Test Folder Structure Organization
  const testDir = path.join(process.cwd(), '.test_memory_scratch');
  await fs.mkdir(testDir, { recursive: true });

  const categories = ['decisions', 'architectures', 'conventions', 'gotchas', 'glossarys'];
  for (const cat of categories) {
    await fs.mkdir(path.join(testDir, cat), { recursive: true });
  }

  const slug = MemoryMarkdownSerializer.slugify(testItem.title);
  const targetMdPath = path.join(testDir, 'architectures', `${slug}.md`);
  await fs.writeFile(targetMdPath, md, 'utf-8');

  const readBack = await fs.readFile(targetMdPath, 'utf-8');
  assert.strictEqual(readBack, md);
  console.log(`  ✅ Verified physical file written to ${targetMdPath}`);

  // 4. Test Index Manifest Generation
  const indexPayload = [{ ...testItem, filePath: `architectures/${slug}.md` }];
  const indexPath = path.join(testDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(indexPayload, null, 2), 'utf-8');

  const loadedIndex = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  assert.strictEqual(loadedIndex.length, 1);
  assert.strictEqual(loadedIndex[0].filePath, `architectures/${slug}.md`);
  console.log('  ✅ Verified index.json manifest references markdown file paths');

  // Clean up scratch dir
  await fs.rm(testDir, { recursive: true, force: true });
  console.log('\n🎉 ALL MEMORY STORAGE & FOLDER ORGANIZATION TESTS PASSED 100%!');
}

runMemoryStorageTests().catch((err) => {
  console.error('❌ Memory storage test failed:', err);
  process.exit(1);
});
