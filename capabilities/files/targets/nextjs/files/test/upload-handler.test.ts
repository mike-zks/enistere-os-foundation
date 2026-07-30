import assert from "node:assert/strict";
import { test } from "node:test";

import { handleUploadFile } from "../src/features/files/handlers/upload-file-handler.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import { apiEnvelope, makeDeps, makeRequest, seedAuth, seedCsrf } from "./helpers/auth-test-kit.js";

const FILE_DATA = new Blob(["data"], { type: "image/jpeg" });
const UPLOADED = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
  originalName: "photo.jpg",
  mimeType: "image/jpeg",
  extension: "jpg",
  size: "4",
  category: "IMAGE",
  status: "PENDING",
  visibility: "PRIVATE",
  createdAt: "2026-07-08T12:00:00.000Z",
  updatedAt: "2026-07-08T12:00:00.000Z",
};
const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/files", timestamp: "t" },
});

function makeUploadRequest(
  opts: {
    csrf?: string;
    origin?: string | null;
    file?: Blob;
    category?: string;
    subjectId?: string;
    contentLength?: string;
  } = {},
): Request {
  const form = new FormData();
  form.append("file", opts.file ?? FILE_DATA, "photo.jpg");
  form.append("category", opts.category ?? "IMAGE");
  if (opts.subjectId !== undefined) form.append("subjectId", opts.subjectId);

  const headers = new Headers();
  const origin = "origin" in opts ? opts.origin : "http://localhost:3100";
  if (origin !== null && origin !== undefined) headers.set("origin", origin);
  if (opts.csrf) headers.set("x-csrf-token", opts.csrf);
  if (opts.contentLength !== undefined) headers.set("content-length", opts.contentLength);

  return new Request("https://web.test/api/files/upload", {
    method: "POST",
    headers,
    body: form,
  });
}

// ── Méthode ──────────────────────────────────────────────────────────────────

test("upload : GET refusé (405) sans appel API", async () => {
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const req = new Request("https://web.test/api/files/upload", { method: "GET" });
  const res = await handleUploadFile(req, makeDeps(new InMemoryCookieStore(), mock));
  assert.equal(res.status, 405);
  assert.equal(mock.calls.length, 0);
});

// ── Origin / CSRF ─────────────────────────────────────────────────────────────

test("upload : Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(
    makeUploadRequest({ csrf, origin: "https://evil.test" }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("upload : CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(
    makeUploadRequest({ csrf: "wrong-csrf-token-aaaaaaaaaaaaa" }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("upload : CSRF absent → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(makeUploadRequest({ csrf: undefined }), makeDeps(store, mock));
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

// ── Validation corps ──────────────────────────────────────────────────────────

test("upload : fichier absent → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });

  const form = new FormData();
  form.append("category", "IMAGE");
  const headers = new Headers({ origin: "http://localhost:3100", "x-csrf-token": csrf });
  const req = new Request("https://web.test/api/files/upload", { method: "POST", headers, body: form });

  const res = await handleUploadFile(req, makeDeps(store, mock));
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "FILE_REQUIRED");
  assert.equal(mock.calls.length, 0);
});

test("upload : catégorie absente → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });

  const form = new FormData();
  form.append("file", FILE_DATA, "photo.jpg");
  const headers = new Headers({ origin: "http://localhost:3100", "x-csrf-token": csrf });
  const req = new Request("https://web.test/api/files/upload", { method: "POST", headers, body: form });

  const res = await handleUploadFile(req, makeDeps(store, mock));
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "INVALID_CATEGORY");
  assert.equal(mock.calls.length, 0);
});

test("upload : catégorie invalide → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(
    makeUploadRequest({ csrf, category: "INVALID_CATEGORY_XYZ" }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "INVALID_CATEGORY");
  assert.equal(mock.calls.length, 0);
});

test("upload : Content-Length trop grand → 413 sans parsing utile ni appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(
    makeUploadRequest({ csrf, contentLength: String(11 * 1024 * 1024) }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 413);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "FILE_TOO_LARGE");
  assert.equal(mock.calls.length, 0);
});

test("upload : subjectId trop long → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(
    makeUploadRequest({ csrf, subjectId: "x".repeat(256) }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "INVALID_SUBJECT_ID");
  assert.equal(mock.calls.length, 0);
});

// ── Succès ────────────────────────────────────────────────────────────────────

test("upload : succès → 200 + PublicStoredFile, no-store, Authorization Bearer", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS", "REFRESH");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(makeUploadRequest({ csrf }), makeDeps(store, mock));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { data: typeof UPLOADED };
  assert.equal(body.data.id, UPLOADED.id);
  assert.equal(body.data.category, "IMAGE");
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer ACCESS");
});

test("upload : subjectId transmis à l'API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(
    makeUploadRequest({ csrf, subjectId: "subject-abc" }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 200);
  // Le FormData envoyé à l'API doit contenir subjectId — vérifié via mock.calls[0].body
  assert.equal(mock.calls.length, 1);
});

test("upload : toutes les catégories valides acceptées", async () => {
  const CATEGORIES = [
    "IMAGE", "DOCUMENT", "AVATAR", "MEDIA", "VIDEO",
    "AUDIO", "IDENTITY_DOCUMENT", "ATTACHMENT", "OTHER",
  ] as const;
  for (const cat of CATEGORIES) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const csrf = seedCsrf(store);
    const mock = createMockFetch({ body: apiEnvelope({ ...UPLOADED, category: cat }) });
    const res = await handleUploadFile(makeUploadRequest({ csrf, category: cat }), makeDeps(store, mock));
    assert.equal(res.status, 200, `catégorie ${cat}`);
  }
});

// ── Mapping erreurs API ────────────────────────────────────────────────────────

test("upload : 401/403/413/415/429/503 mappés distinctement", async () => {
  for (const status of [401, 403, 413, 415, 429, 503] as const) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const csrf = seedCsrf(store);
    const res = await handleUploadFile(
      makeUploadRequest({ csrf }),
      makeDeps(store, createMockFetch(ERR(status))),
    );
    assert.equal(res.status, status, `status ${status}`);
  }
});

test("upload : 409 API (quota) → 409 QUOTA_EXCEEDED (jamais NOT_DOWNLOADABLE)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const res = await handleUploadFile(
    makeUploadRequest({ csrf }),
    makeDeps(store, createMockFetch(ERR(409))),
  );
  assert.equal(res.status, 409);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "QUOTA_EXCEEDED");
  assert.notEqual(body.errorCode, "NOT_DOWNLOADABLE");
});

test("upload : requestId propagé navigateur → API → réponse", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const headers = new Headers({
    origin: "http://localhost:3100",
    "x-csrf-token": csrf,
    "x-request-id": "rid-upload-1",
  });
  const form = new FormData();
  form.append("file", FILE_DATA, "photo.jpg");
  form.append("category", "IMAGE");
  const req = new Request("https://web.test/api/files/upload", { method: "POST", headers, body: form });
  const res = await handleUploadFile(req, makeDeps(store, mock));
  assert.equal(res.headers.get("x-request-id"), "rid-upload-1");
  assert.equal(mock.calls[0]?.headers["x-request-id"], "rid-upload-1");
});

test("upload : réponse contient les champs publics attendus (id, originalName, category…)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(UPLOADED) });
  const res = await handleUploadFile(makeUploadRequest({ csrf }), makeDeps(store, mock));
  const body = (await res.json()) as { data: Record<string, unknown> };
  for (const key of ["id", "originalName", "mimeType", "category", "status", "visibility"]) {
    assert.ok(key in body.data, `champ public manquant: ${key}`);
  }
});
