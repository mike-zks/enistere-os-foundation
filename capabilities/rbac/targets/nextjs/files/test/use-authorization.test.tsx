import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";

import { useAuthorization } from "../src/features/authorization/use-authorization.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const PROFILE = { id: "u1", email: "user@example.test", status: "ACTIVE", createdAt: "t", updatedAt: "t" };
const AUTHZ = { roles: ["administrator"], permissions: ["files.read", "files.upload"] };

const ORIG_FETCH = globalThis.fetch;
const openClients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const client of openClients) client.clear();
  openClients.length = 0;
  globalThis.fetch = ORIG_FETCH;
});

function render() {
  const client = createTestQueryClient();
  openClients.push(client);
  return renderHook(() => useAuthorization(), { wrapper: createWrapper(client) });
}

test("désactivé si session non authentifiée (aucun appel /authorization)", async () => {
  const mock = createBrowserFetch((url) =>
    url.includes("/me") ? { status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } } : { body: { success: true, data: AUTHZ } },
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    // la session se résout (anonyme) → l'authorization reste désactivée
    assert.equal(result.current.roles.length, 0);
  });
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(mock.calls.every((c) => !c.url.includes("/authorization")), "authorization ne doit pas être appelée");
});

test("authentifié → rôles/permissions + helpers OR/AND (sans wildcard)", async () => {
  const mock = createBrowserFetch((url) =>
    url.includes("/me") ? { body: { success: true, data: PROFILE } } : { body: { success: true, data: AUTHZ } },
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.equal(result.current.roles.length, 1);
  });
  assert.deepEqual([...result.current.roles], ["administrator"]);
  assert.equal(result.current.hasRole("administrator"), true);
  assert.equal(result.current.hasRole("user"), false);
  assert.equal(result.current.hasAnyRole(["user", "administrator"]), true);
  assert.equal(result.current.hasAnyRole(["user"]), false);
  assert.equal(result.current.hasPermission("files.read"), true);
  assert.equal(result.current.hasPermission("files.delete"), false);
  assert.equal(result.current.hasAllPermissions(["files.read", "files.upload"]), true);
  assert.equal(result.current.hasAllPermissions(["files.read", "files.delete"]), false);
  // aucune sémantique wildcard
  assert.equal(result.current.hasPermission("files.*"), false);
  assert.equal(result.current.hasPermission("files."), false);
});

test("erreur sur /authorization → error exposé", async () => {
  const mock = createBrowserFetch((url) =>
    url.includes("/me") ? { body: { success: true, data: PROFILE } } : { status: 500, body: { success: false, errorCode: "API_ERROR" } },
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.ok(result.current.error !== undefined);
  });
});
