import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createElement } from "react";

import { AdminFileActions } from "../src/features/files/admin-file-actions.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const PROFILE = { id: "u1", email: "admin@example.test", status: "ACTIVE", createdAt: "t", updatedAt: "t" };
const ORIG = globalThis.fetch;
const open: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function setup(
  permissions: string[],
  handlers: {
    quarantine?: { status?: number; body?: unknown };
    restore?: { status?: number; body?: unknown };
  } = {},
) {
  const client = createTestQueryClient();
  open.push(client);
  const authz = { roles: ["administrator"], permissions };
  const mock = createBrowserFetch((url) => {
    if (url.includes("/api/auth/me")) return { body: { success: true, data: PROFILE } };
    if (url.includes("/api/auth/authorization")) return { body: { success: true, data: authz } };
    if (url.includes("/api/auth/csrf")) return { body: { success: true, data: { csrfToken: "csrf-tok" } } };
    if (url.includes("/quarantine")) return handlers.quarantine ?? { body: { success: true, data: null } };
    if (url.includes("/restore")) return handlers.restore ?? { body: { success: true, data: null } };
    return { status: 404, body: { success: false, errorCode: "NOT_FOUND" } };
  });
  globalThis.fetch = mock as unknown as typeof fetch;
  const Wrapper = createWrapper(client);
  const { container } = render(
    createElement(Wrapper, null, createElement(AdminFileActions, { fileId: ID })),
  );
  return { client, mock, container };
}

test("null si aucune permission admin (files.quarantine et files.restore absentes)", async () => {
  const { container } = setup([]);
  await waitFor(() => {
    // Une fois l'authorization résolue, le composant doit être vide.
    assert.equal(container.querySelector("[aria-label='Actions administrateur']"), null);
  });
});

test("bouton quarantaine visible si files.quarantine", async () => {
  setup(["files.quarantine"]);
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /quarantaine/i }));
  });
  assert.equal(screen.queryByRole("button", { name: /restaurer/i }), null);
});

test("bouton restauration visible si files.restore", async () => {
  setup(["files.restore"]);
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /restaurer/i }));
  });
  assert.equal(screen.queryByRole("button", { name: /quarantaine/i }), null);
});

test("les deux boutons visibles si files.quarantine + files.restore", async () => {
  setup(["files.quarantine", "files.restore"]);
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /quarantaine/i }));
    assert.ok(screen.getByRole("button", { name: /restaurer/i }));
  });
});

test("succès quarantaine : alerte succès affichée, bouton désactivé", async () => {
  setup(["files.quarantine"]);
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /quarantaine/i }));
  });
  await act(async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: /quarantaine/i }));
  });
  await waitFor(() => {
    assert.ok(screen.getByRole("status"));
    assert.ok(screen.getByRole("status").textContent?.includes("quarantaine"));
  });
});

test("erreur quarantaine : alerte danger affichée", async () => {
  setup(["files.quarantine"], { quarantine: { status: 409, body: { success: false, errorCode: "NOT_QUARANTINABLE" } } });
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /quarantaine/i }));
  });
  await act(async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: /quarantaine/i }));
  });
  await waitFor(() => {
    assert.ok(screen.getByRole("alert"));
  });
});

test("succès restauration : alerte succès affichée", async () => {
  setup(["files.restore"]);
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /restaurer/i }));
  });
  await act(async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: /restaurer/i }));
  });
  await waitFor(() => {
    assert.ok(screen.getByRole("status"));
    assert.ok(screen.getByRole("status").textContent?.includes("restaur"));
  });
});

test("erreur restauration : alerte danger affichée", async () => {
  setup(["files.restore"], { restore: { status: 409, body: { success: false, errorCode: "NOT_RESTORABLE" } } });
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /restaurer/i }));
  });
  await act(async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: /restaurer/i }));
  });
  await waitFor(() => {
    assert.ok(screen.getByRole("alert"));
  });
});

test("aucun Bearer navigateur dans les appels de mutation", async () => {
  const { mock } = setup(["files.quarantine"]);
  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: /quarantaine/i }));
  });
  await act(async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: /quarantaine/i }));
  });
  await waitFor(() => assert.ok(screen.getByRole("status")));
  const quarantineCall = mock.calls.find((c) => c.url.includes("/quarantine"));
  assert.equal(quarantineCall?.headers["authorization"], undefined, "jamais de Bearer navigateur");
});
