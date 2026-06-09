/**
 * Multipart : upload Web (FormData, Content-Type non forcé), helper React Native (runtime simulé +
 * différence Node/undici documentée), erreur 413.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ApiClientError,
  EnistereApiClient,
  InMemorySessionAdapter,
  buildUploadFormData,
  createReactNativeUploadFormData,
  isReactNativeFileDescriptor,
} from '../src/index.js';
import { createMockFetch, errorBody, successEnvelope, type MockOutcome, type RecordedCall } from './helpers/mock-fetch.js';

const STORED = {
  id: 'f-1',
  originalName: 'photo.jpg',
  mimeType: 'image/png',
  extension: 'png',
  size: '3',
  visibility: 'PRIVATE',
  status: 'VALIDATED',
  category: 'DOCUMENT',
  createdAt: '2026-06-09T12:00:00.000Z',
  updatedAt: '2026-06-09T12:00:00.000Z',
};

function uploadClient(outcome: (call: RecordedCall) => MockOutcome) {
  const session = new InMemorySessionAdapter({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  const mock = createMockFetch((call) => outcome(call));
  const client = new EnistereApiClient({ baseUrl: 'https://api.test', session, fetch: mock.fetch });
  return { client, calls: mock.calls };
}

test('upload Web : FormData, Content-Type multipart auto (jamais application/json)', async () => {
  const { client, calls } = uploadClient(() => ({ status: 201, body: successEnvelope(STORED) }));
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
  const stored = await client.files.upload(blob, 'DOCUMENT', { subjectId: 'subject-1' });

  assert.equal(stored.size, '3');
  const call = calls[0];
  assert.ok(call?.contentType?.startsWith('multipart/form-data'), `content-type=${call?.contentType}`);
  assert.ok(call?.contentType?.includes('boundary='));
  assert.ok(!call?.contentType?.includes('application/json'));

  const form = await call.getFormData();
  assert.ok(form.has('file'));
  assert.equal(form.get('category'), 'DOCUMENT');
  assert.equal(form.get('subjectId'), 'subject-1');
});

test('détection du descripteur React Native', () => {
  assert.ok(isReactNativeFileDescriptor({ uri: 'file:///a.png', name: 'a.png', type: 'image/png' }));
  assert.ok(!isReactNativeFileDescriptor(new Blob([new Uint8Array([1])])));
});

test('React Native (runtime simulé) : {uri,name,type} accepté comme partie fichier', () => {
  class PermissiveFormData {
    readonly entries: Array<[string, unknown, string | undefined]> = [];
    append(name: string, value: unknown, fileName?: string): void {
      this.entries.push([name, value, fileName]);
    }
    get(name: string): unknown {
      return this.entries.find((e) => e[0] === name)?.[1];
    }
    has(name: string): boolean {
      return this.entries.some((e) => e[0] === name);
    }
  }
  const original = globalThis.FormData;
  (globalThis as { FormData: unknown }).FormData = PermissiveFormData;
  try {
    const form = createReactNativeUploadFormData(
      { uri: 'file:///tmp/avatar.png', name: 'avatar.png', type: 'image/png' },
      'AVATAR',
      'subject-rn',
    ) as unknown as PermissiveFormData;
    assert.ok(form.has('file'));
    assert.equal(form.get('category'), 'AVATAR');
    const fileEntry = form.entries.find((e) => e[0] === 'file');
    assert.equal((fileEntry?.[1] as { uri: string }).uri, 'file:///tmp/avatar.png');
    assert.equal(fileEntry?.[2], 'avatar.png');
  } finally {
    (globalThis as { FormData: unknown }).FormData = original;
  }
});

test('Node/undici (strict) refuse le descripteur RN — différence d’environnement', () => {
  assert.throws(() => buildUploadFormData({ uri: 'file:///a', name: 'a', type: 'image/png' }, 'IMAGE'));
});

test('upload 413 → ApiClientError (sans refresh : 413 ≠ 401)', async () => {
  const { client, calls } = uploadClient(() => ({ status: 413, body: errorBody(413, 'FILE_TOO_LARGE') }));
  const blob = new Blob([new Uint8Array(8)], { type: 'image/png' });
  await assert.rejects(() => client.files.upload(blob, 'IMAGE'), (e: unknown) => e instanceof ApiClientError && e.status === 413);
  assert.equal(calls.filter((c) => c.path === '/auth/refresh').length, 0);
});
