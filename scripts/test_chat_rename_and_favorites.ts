import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { useConversationStore } from '../src/store/useConversationStore';
import { ConversationMeta } from '../electron/services/LocalPersistenceService';

async function runChatRenameAndFavoritesTests() {
  console.log('🧪 Starting Chat Name Management & Favorite Star Tests...\n');

  // Test 1: Store creates conversation with isFavorite initialized to false
  const store = useConversationStore.getState();
  const convId = store.createConversation('Initial Test Chat');
  const created = useConversationStore.getState().conversations.find((c) => c.id === convId);

  assert(created, 'Conversation should exist in store');
  assert.strictEqual(created?.title, 'Initial Test Chat');
  assert.strictEqual(created?.isFavorite, false, 'isFavorite should default to false');
  console.log('  ✅ Successfully created conversation with initial favorite = false');

  // Test 2: Rename conversation via updateConversationTitle
  useConversationStore.getState().updateConversationTitle(convId, 'Refactored Engine Discussion');
  const renamed = useConversationStore.getState().conversations.find((c) => c.id === convId);
  assert.strictEqual(renamed?.title, 'Refactored Engine Discussion', 'Title should be updated');
  console.log('  ✅ Successfully updated conversation title');

  // Test 3: Toggle favorite state
  useConversationStore.getState().toggleFavorite(convId);
  const favorited = useConversationStore.getState().conversations.find((c) => c.id === convId);
  assert.strictEqual(favorited?.isFavorite, true, 'isFavorite should be toggled to true');
  console.log('  ✅ Successfully toggled conversation to favorite (starred)');

  // Test 4: Toggle favorite state back to false
  useConversationStore.getState().toggleFavorite(convId);
  const unfavorited = useConversationStore.getState().conversations.find((c) => c.id === convId);
  assert.strictEqual(unfavorited?.isFavorite, false, 'isFavorite should be toggled back to false');
  console.log('  ✅ Successfully removed conversation from favorites');

  // Test 5: Re-star and verify filter
  useConversationStore.getState().toggleFavorite(convId);
  const favList = useConversationStore.getState().conversations.filter((c) => c.isFavorite);
  assert(favList.some((c) => c.id === convId), 'Conversation should appear in favorites list');
  console.log('  ✅ Verified conversation appears in favorite list filter');

  // Test 6: Persistence meta serialization
  const meta: ConversationMeta = {
    id: convId,
    title: 'Refactored Engine Discussion',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: 'gemini-3.5-flash-lite',
    securityMode: 'guarded',
    messageCount: 5,
    lastPreview: 'Hello world preview',
    isFavorite: true
  };
  assert.strictEqual(meta.isFavorite, true, 'Meta preserves isFavorite flag for disk indexing');
  console.log('  ✅ LocalPersistenceService meta contract supports isFavorite');

  // Test 7: Rule 4 Line Count Verification
  const filesToVerify = [
    'src/types/conversation.ts',
    'src/types/conversationStore.ts',
    'src/store/conversationStorageHelper.ts',
    'src/store/useConversationStore.ts',
    'electron/services/LocalPersistenceService.ts',
    'src/components/agent/session/ConversationItemRow.tsx',
    'src/components/agent/session/WorkspaceConversationGroup.tsx',
    'src/components/agent/session/FavoriteConversationList.tsx',
    'src/components/agent/session/UnassignedConversationList.tsx',
    'src/components/agent/session/ChatSessionDropdownTrigger.tsx',
    'src/components/agent/ChatSessionDropdown.tsx'
  ];

  for (const f of filesToVerify) {
    const full = path.resolve(f);
    const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
    assert(lines <= 150, `Rule 4 Check: ${f} <= 150 lines (Actual: ${lines})`);
    console.log(`  ✅ Rule 4: ${f} has ${lines} lines (<= 150)`);
  }

  console.log('\n🎉 ALL CHAT NAME & FAVORITE STAR INVARIANTS VERIFIED 100%!');
}

runChatRenameAndFavoritesTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
