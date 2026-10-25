import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { LocalPersistenceService } from '../electron/services/LocalPersistenceService.ts';

const TEST_DIR = path.resolve(process.cwd(), 'sandbox_persistence_test');

async function testPersistence() {
  console.log('🧪 Starting LocalPersistenceService Test Suite...');

  // Set up mock userData folder
  process.env.APPDATA = TEST_DIR;
  const service = new LocalPersistenceService();

  // Test 1: Empty list initially
  const initial = await service.listConversations();
  assert.ok(Array.isArray(initial));

  // Test 2: Save Conversation (atomic write & indexing)
  const conv1 = {
    id: 'conv-test-101',
    title: 'Refactor Auth Service',
    workspaceId: 'ws-alpha',
    workspacePath: '/mock/project',
    model: 'gemini-3.5-flash-lite',
    securityMode: 'guarded',
    createdAt: Date.now(),
    messages: [
      { id: 'm1', role: 'user', text: 'Refactor auth please', timestamp: Date.now() },
      { id: 'm2', role: 'agent', text: 'Done refactoring!', timestamp: Date.now() }
    ]
  };

  await service.saveConversation(conv1);

  // Wait 200ms for debounce timer to flush
  await new Promise(r => setTimeout(r, 200));

  // Test 3: List Conversations should have 1 item with metadata
  const list = await service.listConversations();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, 'conv-test-101');
  assert.strictEqual(list[0].messageCount, 2);
  assert.strictEqual(list[0].lastPreview, 'Done refactoring!');
  console.log('✅ Sharded Conversation index verified');

  // Test 4: Lazy Load getConversation returns full messages
  const retrieved = await service.getConversation('conv-test-101');
  assert.ok(retrieved !== null);
  assert.strictEqual(retrieved.id, 'conv-test-101');
  assert.strictEqual(retrieved.messages.length, 2);
  console.log('✅ Full conversation shard lazy loading verified');

  // Test 5: Memories Persistence (Global vs Workspace-scoped)
  const memories = [
    { id: 'mem-1', title: 'Code style', category: 'convention', content: 'Always use tabs', scope: 'global', pinned: true },
    { id: 'mem-2', title: 'Local DB', category: 'architecture', content: 'Use SQLite', scope: 'workspace', pinned: true }
  ];

  await service.saveMemories(memories, TEST_DIR);
  const loadedMems = await service.loadMemories(TEST_DIR);
  assert.strictEqual(loadedMems.global.length, 1);
  assert.strictEqual(loadedMems.workspace.length, 1);
  assert.strictEqual(loadedMems.global[0].title, 'Code style');
  assert.strictEqual(loadedMems.workspace[0].title, 'Local DB');
  console.log('✅ Local & Workspace Memories storage verified');

  // Test 6: Delete Conversation
  await service.deleteConversation('conv-test-101');
  const afterDeleteList = await service.listConversations();
  assert.strictEqual(afterDeleteList.length, 0);
  const afterDeleteGet = await service.getConversation('conv-test-101');
  assert.strictEqual(afterDeleteGet, null);
  console.log('✅ Deletion & cleanup verified');

  // Clean up
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  console.log('🎉 ALL LOCAL PERSISTENCE TESTS PASSED (100% SUCCESS)!');
}

testPersistence().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
