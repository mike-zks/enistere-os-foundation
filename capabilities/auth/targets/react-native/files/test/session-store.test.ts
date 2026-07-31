import assert from 'node:assert/strict';
import { test } from 'node:test';

import { InMemorySecureStorage } from '../src/storage/memory-secure-storage';
import { SessionStore, type PersistedSession } from '../src/features/auth/session-store';
import { STORAGE_KEYS } from '../src/features/auth/storage-keys';

function makeStore(): { storage: InMemorySecureStorage; store: SessionStore } {
  const storage = new InMemorySecureStorage();
  return { storage, store: new SessionStore(storage) };
}

const SAMPLE: PersistedSession = {
  refreshToken: 'placeholder-refresh-token.1',
  expiresAt: 123_456,
  user: { id: 'u', displayName: 'demo' },
};

test('save then load round-trips the session envelope', async () => {
  const { store } = makeStore();
  await store.save(SAMPLE);
  assert.deepEqual(await store.load(), SAMPLE);
});

test('load returns null when nothing is persisted', async () => {
  const { store } = makeStore();
  assert.equal(await store.load(), null);
});

test('load returns null on corrupt JSON (fails soft)', async () => {
  const { storage, store } = makeStore();
  await storage.setItem(STORAGE_KEYS.session, 'not-json{');
  assert.equal(await store.load(), null);
});

test('load returns null on invalid shape (missing refreshToken)', async () => {
  const { storage, store } = makeStore();
  await storage.setItem(STORAGE_KEYS.session, JSON.stringify({ expiresAt: 1, user: null }));
  assert.equal(await store.load(), null);
});

test('clear removes the persisted session', async () => {
  const { store } = makeStore();
  await store.save(SAMPLE);
  await store.clear();
  assert.equal(await store.load(), null);
});
