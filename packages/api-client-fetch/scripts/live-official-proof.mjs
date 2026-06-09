// @ts-check
/**
 * PREUVE LIVE OFFICIELLE — importe le PACKAGE `@enistere/api-client-fetch` (résolu vers son build via
 * le workspace) et l'exécute contre une API RÉELLE (PostgreSQL + MinIO jetables). Couvre login, profil,
 * autorisations, upload multipart, metadata, URL signée + GET HTTP réel, quarantaine/restauration,
 * suppression 204, refresh, logout, et 401/403/404/413 + X-Request-Id. Code 1 au moindre échec.
 *
 * N'utilise PAS le proof expérimental : seulement les packages officiels.
 */
import {
  ApiClientError,
  createEnistereApiClient,
  InMemorySessionAdapter,
} from '@enistere/api-client-fetch';

const BASE_URL = process.env.PROOF_BASE_URL ?? 'http://localhost:3999';
const ADMIN_EMAIL = process.env.PROOF_ADMIN_EMAIL ?? 'openapi-proof-admin@example.test';
const ADMIN_PASSWORD = process.env.PROOF_ADMIN_PASSWORD ?? 'Proof-Sup3rSecret!';
const NOPERM_EMAIL = process.env.PROOF_NOPERM_EMAIL ?? 'openapi-proof-noperm@example.test';
const NOPERM_PASSWORD = process.env.PROOF_NOPERM_PASSWORD ?? 'Proof-Sup3rSecret!';
const RANDOM_UUID = '00000000-0000-4000-8000-0000000000ff';
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);

let seq = 0;
function newClient() {
  return createEnistereApiClient({
    baseUrl: BASE_URL,
    session: new InMemorySessionAdapter(),
    timeoutMs: 10_000,
    createRequestId: () => `official-${(seq += 1)}`,
  });
}

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error?.message ?? String(error) });
    console.log(`FAIL  ${name} :: ${error?.message ?? error}`);
  }
}

const client = newClient();
let uploadedId = '';

await step('01 login (admin)', async () => {
  const session = await client.auth.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (session.user.email !== ADMIN_EMAIL) throw new Error('email mismatch');
  if (session.tokenType !== 'Bearer') throw new Error('tokenType mismatch');
});

await step('02 getProfile', async () => {
  const profile = await client.auth.getProfile();
  if (profile.email !== ADMIN_EMAIL || profile.status !== 'ACTIVE') throw new Error('profil inattendu');
});

await step('03 getAuthorization', async () => {
  const authz = await client.auth.getAuthorization();
  if (!authz.roles.includes('administrator')) throw new Error('rôle administrator absent');
  if (!authz.permissions.includes('files.upload')) throw new Error('permission files.upload absente');
});

await step('04 upload multipart (Blob, IMAGE)', async () => {
  const stored = await client.files.upload(new Blob([JPEG], { type: 'image/jpeg' }), 'IMAGE', { subjectId: 'official' });
  uploadedId = stored.id;
  if (typeof stored.size !== 'string') throw new Error('size doit être une chaîne (BigInt)');
  if (stored.status !== 'VALIDATED') throw new Error('statut attendu VALIDATED');
});

await step('05 getMetadata', async () => {
  const meta = await client.files.getMetadata(uploadedId);
  if (meta.id !== uploadedId || meta.mimeType !== 'image/jpeg') throw new Error('metadata inattendue');
});

let signedUrl = '';
await step('06 createDownloadUrl', async () => {
  const signed = await client.files.createDownloadUrl(uploadedId);
  if (!signed.url.startsWith('http') || typeof signed.expiresAt !== 'string') throw new Error('URL signée inattendue');
  signedUrl = signed.url;
});

await step('07 GET HTTP réel sur l’URL signée', async () => {
  const res = await fetch(signedUrl);
  if (res.status !== 200) throw new Error(`status ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength !== JPEG.byteLength) throw new Error('octets non conformes');
});

await step('08 quarantaine + restauration + suppression (admin)', async () => {
  const file2 = await client.files.upload(new Blob([JPEG], { type: 'image/jpeg' }), 'IMAGE');
  await client.files.quarantine(file2.id);
  await client.files.restore(file2.id);
  await client.files.delete(file2.id);
});

await step('09 deleteFile (204 No Content)', async () => {
  await client.files.delete(uploadedId);
});

await step('10 getMetadata après suppression → 404 + requestId', async () => {
  try {
    await client.files.getMetadata(uploadedId);
    throw new Error('aurait dû échouer (404)');
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw new Error('attendu ApiClientError 404');
    if (typeof error.requestId !== 'string' || error.requestId.length === 0) throw new Error('requestId manquant');
  }
});

await step('11 refresh puis profil', async () => {
  const tokens = await client.auth.refresh();
  if (tokens.tokenType !== 'Bearer') throw new Error('refresh inattendu');
  const profile = await client.auth.getProfile();
  if (profile.email !== ADMIN_EMAIL) throw new Error('profil post-refresh inattendu');
});

await step('12 401 sans token (refresh désactivé)', async () => {
  const anon = createEnistereApiClient({ baseUrl: BASE_URL, session: new InMemorySessionAdapter(), enableRefresh: false });
  try {
    await anon.auth.getProfile();
    throw new Error('aurait dû échouer (401)');
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) throw new Error('attendu 401');
  }
});

await step('13 403 utilisateur sans permission', async () => {
  const noperm = newClient();
  await noperm.auth.login(NOPERM_EMAIL, NOPERM_PASSWORD);
  try {
    await noperm.files.getMetadata(RANDOM_UUID);
    throw new Error('aurait dû échouer (403)');
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 403) throw new Error('attendu 403');
  }
});

await step('14 413 fichier trop volumineux', async () => {
  try {
    await client.files.upload(new Blob([new Uint8Array(5000)], { type: 'image/jpeg' }), 'IMAGE');
    throw new Error('aurait dû échouer (413)');
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 413) throw new Error('attendu 413');
  }
});

await step('15 X-Request-Id dans la réponse', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  if ((res.headers.get('x-request-id') ?? '').length === 0) throw new Error('X-Request-Id absent');
});

await step('16 logout puis 401', async () => {
  const result = await client.auth.logout();
  if (result.status !== 'logged_out') throw new Error('logout inattendu');
  const anon = createEnistereApiClient({ baseUrl: BASE_URL, session: new InMemorySessionAdapter(), enableRefresh: false });
  try {
    await anon.auth.getProfile();
    throw new Error('aurait dû échouer (401)');
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) throw new Error('attendu 401 après logout');
  }
});

const failed = results.filter((r) => !r.ok);
console.log(`\nOFFICIAL LIVE PROOF: ${results.length - failed.length}/${results.length} steps passed`);
if (failed.length > 0) {
  console.log('FAILED:', JSON.stringify(failed, null, 2));
  process.exit(1);
}
console.log('OFFICIAL LIVE PROOF OK');
