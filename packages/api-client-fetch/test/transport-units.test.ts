/**
 * Unités de transport : SingleFlight (dédup concurrente), withTimeout (timeout vs annulation
 * utilisateur), defaultRequestIdFactory.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SingleFlight } from '../src/auth/refresh-coordinator.js';
import { ApiClientError } from '../src/errors/api-client-error.js';
import { defaultRequestIdFactory } from '../src/request/request-id.js';
import { withTimeout } from '../src/request/timeout.js';

test('SingleFlight : N appels concurrents ⇒ une seule exécution', async () => {
  const flight = new SingleFlight<number>();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 10));
    return 42;
  };
  const [a, b, c] = await Promise.all([flight.run(factory), flight.run(factory), flight.run(factory)]);
  assert.equal(a, 42);
  assert.equal(b, 42);
  assert.equal(c, 42);
  assert.equal(calls, 1);
  // Une exécution ultérieure relance bien (l'état en vol a été réinitialisé).
  await flight.run(factory);
  assert.equal(calls, 2);
});

test('withTimeout : dépassement ⇒ ApiClientError timeout', async () => {
  await assert.rejects(
    () => withTimeout(() => new Promise<never>(() => {}), 20),
    (e: unknown) => e instanceof ApiClientError && e.kind === 'timeout',
  );
});

test('withTimeout : annulation utilisateur ⇒ re-levée telle quelle (pas un timeout)', async () => {
  const controller = new AbortController();
  const promise = withTimeout(() => new Promise<never>(() => {}), 10_000, controller.signal);
  controller.abort(new Error('user-cancelled'));
  await assert.rejects(promise, (e: unknown) => e instanceof Error && !(e instanceof ApiClientError));
});

test('withTimeout : succès renvoie la valeur', async () => {
  const value = await withTimeout(async () => 'ok', 1000);
  assert.equal(value, 'ok');
});

test('defaultRequestIdFactory : chaîne non vide', () => {
  const id = defaultRequestIdFactory();
  assert.equal(typeof id, 'string');
  assert.ok(id.length > 0);
});
