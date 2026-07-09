/**
 * Tests de TYPES (compile-time) des exports/helpers + assertions runtime minimales.
 * Si un type diverge du contrat, la compilation de ce fichier échoue (donc le test échoue).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type {
  ApiErrorResponse,
  ApiSchemas,
  OperationJsonRequestBody,
  OperationJsonResponse,
  SchemaOf,
} from '../src/index.js';

// --- Assertions purement au niveau type (aucune émission runtime ; exportées pour être "utilisées") ---
type Expect<T extends true> = T;
export type _ContractTypeAssertions = [
  // L'upload est multipart : pas de corps JSON.
  Expect<[OperationJsonRequestBody<'files_upload'>] extends [never] ? true : false>,
  // La suppression (204) n'a pas de corps JSON de succès.
  Expect<[OperationJsonResponse<'files_delete', 204>] extends [never] ? true : false>,
  // La liste est un GET : pas de corps JSON.
  Expect<[OperationJsonRequestBody<'files_list'>] extends [never] ? true : false>,
];

test('SchemaOf<PublicStoredFileDto> : size string + enums fermées', () => {
  const file: SchemaOf<'PublicStoredFileDto'> = {
    id: 'b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d',
    originalName: 'photo.jpg',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    size: '1048576',
    visibility: 'PRIVATE',
    status: 'VALIDATED',
    category: 'IMAGE',
    createdAt: '2026-06-09T12:00:00.000Z',
    updatedAt: '2026-06-09T12:00:00.000Z',
  };
  assert.equal(typeof file.size, 'string');
  assert.equal(file.category, 'IMAGE');
});

test('SchemaOf<FileListResponseDto> : pagination publique typée', () => {
  const page: SchemaOf<'FileListResponseDto'> = {
    items: [],
    limit: 20,
    offset: 0,
    nextOffset: null,
  };
  page.nextOffset = 20;
  assert.equal(typeof page.limit, 'number');
  assert.equal(page.nextOffset, 20);
});

test('OperationJsonRequestBody<auth_login> : email + password', () => {
  const body: OperationJsonRequestBody<'auth_login'> = { email: 'user@example.com', password: 'secret' };
  assert.equal(typeof body.email, 'string');
  assert.equal(typeof body.password, 'string');
});

test('OperationJsonResponse<auth_login,200> : enveloppe { success, data, timestamp }', () => {
  const data = {
    user: {
      id: 'b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d',
      email: 'user@example.com',
      status: 'ACTIVE' as const,
      createdAt: '2026-06-09T12:00:00.000Z',
      updatedAt: '2026-06-09T12:00:00.000Z',
      deactivatedAt: null,
    },
    accessToken: 'a',
    refreshToken: 'r',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 1209600,
    tokenType: 'Bearer' as const,
  };
  const envelope: OperationJsonResponse<'auth_login', 200> = { success: true, data, timestamp: 't' };
  assert.equal(envelope.success, true);
  assert.equal(envelope.data.tokenType, 'Bearer');
});

test('ApiErrorResponse : forme du corps d’erreur commun', () => {
  const err: ApiErrorResponse = {
    success: false,
    statusCode: 404,
    message: 'File not found.',
    errorCode: 'FILE_NOT_FOUND',
    path: '/files/x',
    timestamp: '2026-06-09T12:00:00.000Z',
    requestId: 'r-1',
  };
  assert.equal(err.errorCode, 'FILE_NOT_FOUND');
  assert.equal(err.success, false);
});

test('ApiSchemas indexe les schémas nommés', () => {
  const status: ApiSchemas['UserProfileResponseDto']['status'] = 'ACTIVE';
  assert.equal(status, 'ACTIVE');
});
