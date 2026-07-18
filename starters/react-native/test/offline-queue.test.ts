/**
 * Offline mutation queue + mutation envelope (RN 3) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createOfflineMutation,
  isOfflineMutation,
  OfflineMutationError,
  type OfflineMutation,
} from '../src/offline/mutation';
import { OfflineMutationQueue } from '../src/offline/queue';

function mutation(id: string, createdAt = 1): OfflineMutation<{ id: string }> {
  return createOfflineMutation({ id, type: 'noop', payload: { id }, createdAt });
}

test('FIFO: peek and dequeue return the oldest first', () => {
  const q = new OfflineMutationQueue<{ id: string }>();
  q.enqueue(mutation('a', 1));
  q.enqueue(mutation('b', 2));
  q.enqueue(mutation('c', 3));
  assert.equal(q.size, 3);
  assert.equal(q.peek()?.id, 'a');
  assert.equal(q.dequeue()?.id, 'a');
  assert.equal(q.dequeue()?.id, 'b');
  assert.equal(q.dequeue()?.id, 'c');
  assert.equal(q.isEmpty, true);
});

test('dequeue / peek on an empty queue return undefined', () => {
  const q = new OfflineMutationQueue();
  assert.equal(q.dequeue(), undefined);
  assert.equal(q.peek(), undefined);
  assert.equal(q.size, 0);
  assert.equal(q.isEmpty, true);
});

test('clear empties the queue', () => {
  const q = new OfflineMutationQueue<{ id: string }>();
  q.enqueue(mutation('a'));
  q.enqueue(mutation('b'));
  q.clear();
  assert.equal(q.isEmpty, true);
  assert.equal(q.size, 0);
});

test('remove drops a mutation by id', () => {
  const q = new OfflineMutationQueue<{ id: string }>();
  q.enqueue(mutation('a'));
  q.enqueue(mutation('b'));
  assert.equal(q.remove('a'), true);
  assert.equal(q.remove('missing'), false);
  assert.equal(q.peek()?.id, 'b');
  assert.equal(q.size, 1);
});

test('toArray is a defensive snapshot', () => {
  const q = new OfflineMutationQueue<{ id: string }>();
  q.enqueue(mutation('a'));
  const snapshot = q.toArray();
  q.dequeue();
  assert.equal(snapshot.length, 1);
  assert.equal(q.size, 0);
});

test('enqueue rejects a structurally invalid mutation', () => {
  const q = new OfflineMutationQueue();
  const invalid: OfflineMutation = { id: '', type: 'noop', payload: {}, createdAt: 1 };
  assert.throws(() => q.enqueue(invalid), OfflineMutationError);
  assert.equal(q.size, 0);
});

test('createOfflineMutation throws on invalid input', () => {
  assert.throws(() => createOfflineMutation({ id: '', type: 't', payload: 1, createdAt: 1 }), OfflineMutationError);
  assert.throws(() => createOfflineMutation({ id: 'x', type: '', payload: 1, createdAt: 1 }), OfflineMutationError);
  assert.throws(
    () => createOfflineMutation({ id: 'x', type: 't', payload: 1, createdAt: Number.NaN }),
    OfflineMutationError,
  );
});

test('isOfflineMutation guards the shape', () => {
  assert.equal(isOfflineMutation(mutation('a')), true);
  assert.equal(isOfflineMutation({ id: 'a' }), false);
  assert.equal(isOfflineMutation({ id: 'a', type: 't', createdAt: 1 }), false); // no payload key
  assert.equal(isOfflineMutation(null), false);
  assert.equal(isOfflineMutation('nope'), false);
});

test('maxSize caps the queue and rejects overflow', () => {
  const q = new OfflineMutationQueue<{ id: string }>({ maxSize: 2 });
  q.enqueue(mutation('a'));
  q.enqueue(mutation('b'));
  assert.throws(() => q.enqueue(mutation('c')), OfflineMutationError);
  assert.equal(q.size, 2);
});

test('an invalid maxSize is rejected at construction', () => {
  assert.throws(() => new OfflineMutationQueue({ maxSize: 0 }), OfflineMutationError);
  assert.throws(() => new OfflineMutationQueue({ maxSize: 1.5 }), OfflineMutationError);
  assert.throws(() => new OfflineMutationQueue({ maxSize: -1 }), OfflineMutationError);
});
