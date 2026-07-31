import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AuthEngine } from '../src/features/auth/auth-engine';
import { InMemorySecureStorage } from '../src/storage/memory-secure-storage';
import { SessionStore, type PersistedSession } from '../src/features/auth/session-store';
import { MockAuthApi } from './helpers';

function setup(opts?: { api?: MockAuthApi; now?: () => number }): {
  engine: AuthEngine;
  sessionStore: SessionStore;
  api: MockAuthApi;
} {
  const storage = new InMemorySecureStorage();
  const sessionStore = new SessionStore(storage);
  const api = opts?.api ?? new MockAuthApi();
  const engine = new AuthEngine({ sessionStore, authApi: api, now: opts?.now });
  return { engine, sessionStore, api };
}

const PERSISTED: PersistedSession = {
  refreshToken: 'placeholder-refresh-token.seed',
  expiresAt: null,
  user: { id: 'u', displayName: 'demo' },
};

test('restoreSession with no persisted session → unauthenticated', async () => {
  const { engine } = setup();
  await engine.restoreSession();
  assert.equal(engine.getSnapshot().status, 'unauthenticated');
  assert.equal(engine.getAccessToken(), null);
});

test('restoreSession with a persisted session refreshes → authenticated', async () => {
  const { engine, sessionStore, api } = setup();
  await sessionStore.save(PERSISTED);
  await engine.restoreSession();
  assert.equal(engine.getSnapshot().status, 'authenticated');
  assert.equal(api.refreshCalls, 1);
  assert.notEqual(engine.getAccessToken(), null);
  // Snapshot is token-free.
  assert.deepEqual(Object.keys(engine.getSnapshot().session ?? {}).sort(), [
    'expiresAt',
    'user',
  ]);
});

test('restoreSession with a failing refresh → expired + storage cleared', async () => {
  const api = new MockAuthApi();
  api.failRefresh = true;
  const { engine, sessionStore } = setup({ api });
  await sessionStore.save(PERSISTED);
  await engine.restoreSession();
  assert.equal(engine.getSnapshot().status, 'expired');
  assert.equal(engine.getAccessToken(), null);
  assert.equal(await sessionStore.load(), null);
});

test('signIn success → authenticated + refresh token persisted', async () => {
  const { engine, sessionStore } = setup();
  await engine.signIn({ email: 'demo@example.com' });
  assert.equal(engine.getSnapshot().status, 'authenticated');
  assert.notEqual(engine.getAccessToken(), null);
  assert.notEqual(await sessionStore.load(), null);
});

test('signIn failure → unauthenticated + error', async () => {
  const api = new MockAuthApi();
  api.failLogin = true;
  const { engine } = setup({ api });
  await engine.signIn({ email: 'demo@example.com' });
  assert.equal(engine.getSnapshot().status, 'unauthenticated');
  assert.equal(engine.getSnapshot().error, 'Sign-in failed.');
  assert.equal(engine.getAccessToken(), null);
});

test('signOut requests remote revocation then purges storage and memory', async () => {
  const { engine, sessionStore, api } = setup();
  await engine.signIn({ email: 'demo@example.com' });
  await engine.signOut();
  assert.equal(api.logoutCalls, 1);
  assert.match(api.lastLogoutToken ?? '', /^placeholder-refresh-token\./);
  assert.equal(engine.getSnapshot().status, 'unauthenticated');
  assert.equal(engine.getAccessToken(), null);
  assert.equal(await sessionStore.load(), null);
});

test('signOut purges storage even when remote logout fails', async () => {
  const api = new MockAuthApi();
  api.failLogout = true;
  const { engine, sessionStore } = setup({ api });
  await engine.signIn({ email: 'demo@example.com' });
  await assert.doesNotReject(() => engine.signOut());
  assert.equal(api.logoutCalls, 1);
  assert.equal(engine.getSnapshot().status, 'unauthenticated');
  assert.equal(engine.getAccessToken(), null);
  assert.equal(await sessionStore.load(), null);
});

test('refreshSession success returns a new access token', async () => {
  const { engine } = setup();
  await engine.signIn({ email: 'demo@example.com' });
  const token = await engine.refreshSession();
  assert.equal(typeof token, 'string');
  assert.equal(engine.getSnapshot().status, 'authenticated');
});

test('concurrent refreshSession calls are coalesced (refresh runs once)', async () => {
  const api = new MockAuthApi();
  const { engine } = setup({ api });
  await engine.signIn({ email: 'demo@example.com' });
  api.useGate();
  const p1 = engine.refreshSession();
  const p2 = engine.refreshSession();
  api.releaseGate();
  const [t1, t2] = await Promise.all([p1, p2]);
  assert.equal(api.refreshCalls, 1);
  assert.equal(t1, t2);
});

test('refreshSession failure → expired + storage cleared + null token', async () => {
  const api = new MockAuthApi();
  const { engine, sessionStore } = setup({ api });
  await engine.signIn({ email: 'demo@example.com' });
  api.failRefresh = true;
  const token = await engine.refreshSession();
  assert.equal(token, null);
  assert.equal(engine.getSnapshot().status, 'expired');
  assert.equal(await sessionStore.load(), null);
});

test('getAccessToken returns null once the access token has expired', async () => {
  let nowValue = 1_000;
  const now = (): number => nowValue;
  const api = new MockAuthApi(now, 5_000); // expiresAt = now + 5000
  const { engine } = setup({ api, now });
  await engine.signIn({ email: 'demo@example.com' });
  assert.notEqual(engine.getAccessToken(), null); // valid at t=1000
  nowValue = 7_000; // past expiry (6000)
  assert.equal(engine.getAccessToken(), null);
  assert.equal(engine.hasValidAccessToken(), false);
});
