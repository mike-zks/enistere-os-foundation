/**
 * Tests de l'artefact généré : 14 opérations, formes critiques, absence de champs sensibles.
 * La reproductibilité et la détection de divergence sont couvertes par `npm run generate:check`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// npm exécute le script avec cwd = racine du package.
const SCHEMA_PATH = join(process.cwd(), 'src', 'generated', 'schema.ts');
const schema = readFileSync(SCHEMA_PATH, 'utf8');

const OPERATION_IDS = [
  'health_get',
  'health_live',
  'health_ready',
  'auth_login',
  'auth_refresh',
  'auth_logout',
  'auth_getProfile',
  'auth_getAuthorization',
  'files_upload',
  'files_getMetadata',
  'files_createDownloadUrl',
  'files_delete',
  'files_quarantine',
  'files_restore',
];

test('artefact marqué généré / non modifiable', () => {
  assert.match(schema, /NE PAS MODIFIER À LA MAIN/);
  assert.match(schema, /openapi-typescript/);
});

test('expose paths, components et operations', () => {
  assert.match(schema, /export interface paths/);
  assert.match(schema, /export interface components/);
  assert.match(schema, /export interface operations/);
});

test('contient les 14 operationId Health/Auth/Files', () => {
  for (const id of OPERATION_IDS) {
    assert.ok(schema.includes(`${id}:`), `operationId manquant : ${id}`);
  }
});

test('size BigInt en string, enums fermées, 204 sans corps', () => {
  assert.match(schema, /size: string/);
  assert.match(schema, /"IMAGE" \| "DOCUMENT" \| "AVATAR"/);
  assert.match(schema, /204: \{/);
});

test('multipart (file binaire) + erreur commune', () => {
  assert.match(schema, /"multipart\/form-data"/);
  assert.match(schema, /file: string/);
  assert.match(schema, /ApiErrorResponseDto:/);
  assert.match(schema, /requestId\?: string/);
});

test('aucun champ/secret sensible dans l’artefact', () => {
  for (const token of ['passwordHash', 'tokenHash', 'storageKey', 'X-Amz-Signature', 'minioadmin']) {
    assert.ok(!schema.includes(token), `token interdit : ${token}`);
  }
});
