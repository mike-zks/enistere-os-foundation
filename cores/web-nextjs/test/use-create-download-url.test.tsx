import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { useCreateDownloadUrl } from "../src/features/files/use-create-download-url.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const SIGNED_URL = "https://storage.test/obj?X-Amz-Signature=SECRET-SIGNATURE";
const ORIG = globalThis.fetch;
const ORIG_CLICK = HTMLAnchorElement.prototype.click;
const open: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
  HTMLAnchorElement.prototype.click = ORIG_CLICK;
  document.body.innerHTML = "";
});

function setup(downloadSpec: (url: string) => { status?: number; body?: unknown }) {
  HTMLAnchorElement.prototype.click = function noop(): void {}; // jsdom : pas de navigation réelle
  const client = createTestQueryClient();
  open.push(client);
  const mock = createBrowserFetch((url) =>
    url.includes("/api/auth/csrf") ? { body: { success: true, data: { csrfToken: "tok" } } } : downloadSpec(url),
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = renderHook(() => useCreateDownloadUrl(), { wrapper: createWrapper(client) });
  return { client, mock, result };
}

test("succès : CSRF → POST download-url ; URL consommée, JAMAIS dans le cache", async () => {
  const { client, mock, result } = setup(() => ({ body: { success: true, data: { url: SIGNED_URL, expiresAt: "t" } } }));
  await act(async () => {
    result.current.download(ID);
    await waitFor(() => assert.equal(result.current.isPending, false));
  });
  assert.ok(mock.calls.some((c) => c.url.includes("/download-url")));
  // L'URL signée n'est NULLE PART dans le QueryCache (mutationFn retourne void).
  const dump = JSON.stringify(client.getQueryCache().getAll().map((q) => q.state.data));
  assert.ok(!dump.includes("X-Amz-Signature") && !dump.includes("SECRET-SIGNATURE"));
  assert.equal(result.current.error, undefined);
});

test("double-clic empêché (un seul POST download-url)", async () => {
  const { mock, result } = setup(() => ({ body: { success: true, data: { url: SIGNED_URL, expiresAt: "t" } } }));
  await act(async () => {
    result.current.download(ID);
    result.current.download(ID);
    await waitFor(() => assert.equal(result.current.isPending, false));
  });
  assert.equal(mock.calls.filter((c) => c.url.includes("/download-url")).length, 1);
});

test("409 → erreur action non disponible exposée, aucune URL", async () => {
  const { result } = setup(() => ({ status: 409, body: { success: false, errorCode: "NOT_DOWNLOADABLE" } }));
  await act(async () => {
    result.current.download(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "error");
  assert.ok(result.current.error?.message.toLowerCase().includes("disponible"));
});
