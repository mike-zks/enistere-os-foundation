import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { FileListView } from "../src/features/files/file-list-view.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const FILE = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
  originalName: "rapport-2026.pdf",
  mimeType: "application/pdf",
  extension: "pdf",
  size: "204800",
  category: "DOCUMENT" as const,
  status: "VALIDATED" as const,
  visibility: "PRIVATE" as const,
  createdAt: "2026-06-09T12:00:00.000Z",
  updatedAt: "2026-06-09T12:00:00.000Z",
};

const LIST_RESPONSE = { items: [FILE], limit: 20, offset: 0, nextOffset: null };
const ORIG = globalThis.fetch;
const open: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function renderView(props: { limit?: number; offset?: number } = {}) {
  const client = createTestQueryClient();
  open.push(client);
  const Wrapper = createWrapper(client);
  return { client, ...render(<FileListView {...props} />, { wrapper: Wrapper }) };
}

test("état chargement : role=status affiché, aria-live=polite", () => {
  globalThis.fetch = createBrowserFetch({ hangUntilAbort: true }) as unknown as typeof fetch;
  const { container } = renderView();
  const status = container.querySelector("[role='status']");
  assert.ok(status, "role=status absent pendant le chargement");
  assert.equal(status?.getAttribute("aria-live"), "polite");
});

test("état vide : EmptyState affiché si items=[]", async () => {
  globalThis.fetch = createBrowserFetch({
    body: { success: true, data: { items: [], limit: 20, offset: 0, nextOffset: null } },
  }) as unknown as typeof fetch;
  renderView();
  await waitFor(() => assert.ok(screen.queryByText("Aucun fichier"), "EmptyState absent"));
  assert.ok(screen.queryByText(/déposer/i), "lien upload absent");
});

test("état erreur : Alert role=alert affiché, message générique", async () => {
  globalThis.fetch = createBrowserFetch({ status: 503, body: { success: false, errorCode: "STORAGE_UNAVAILABLE" } }) as unknown as typeof fetch;
  renderView();
  await waitFor(() => assert.ok(screen.queryByRole("alert"), "alert absent"));
  assert.ok(screen.getByRole("alert").textContent?.length ?? 0 > 0, "message d'erreur vide");
});

test("liste : champs publics affichés (originalName, mimeType, category, status, visibility)", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } }) as unknown as typeof fetch;
  const { container } = renderView();
  await waitFor(() => assert.ok(screen.queryByRole("list"), "liste absente"));
  const html = container.innerHTML;
  assert.ok(html.includes("rapport-2026.pdf"), "originalName absent");
  assert.ok(html.includes("application/pdf"), "mimeType absent");
  assert.ok(html.includes("DOCUMENT"), "category absent");
  assert.ok(html.includes("VALIDATED"), "status absent");
  assert.ok(html.includes("PRIVATE"), "visibility absent");
  assert.ok(html.includes("200.0 KiB"), "taille formatée absente");
});

test("liste : aucun champ interne (storageKey/bucket/checksum/ownerId)", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } }) as unknown as typeof fetch;
  const { container } = renderView();
  await waitFor(() => assert.ok(screen.queryByRole("list"), "liste absente"));
  const dump = container.innerHTML.toLowerCase();
  for (const internal of ["storagekey", "bucket", "checksum", "ownerid", "x-amz"]) {
    assert.ok(!dump.includes(internal), `champ interne exposé : ${internal}`);
  }
});

test("liste : lien vers /protected/files/:id pour chaque élément", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } }) as unknown as typeof fetch;
  const { container } = renderView();
  await waitFor(() => assert.ok(screen.queryByRole("list"), "liste absente"));
  const links = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
  assert.ok(
    links.some((href) => href.includes(`/protected/files/${FILE.id}`)),
    `aucun lien vers /protected/files/${FILE.id}`,
  );
});

test("pagination : Suivant affiché si nextOffset non null", async () => {
  const withNext = { items: [FILE], limit: 20, offset: 0, nextOffset: 20 };
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: withNext } }) as unknown as typeof fetch;
  const { container } = renderView({ limit: 20, offset: 0 });
  await waitFor(() => assert.ok(screen.queryByRole("list"), "liste absente"));
  const nav = container.querySelector("nav[aria-label='Pagination']");
  assert.ok(nav, "nav pagination absent");
  const links = Array.from(nav?.querySelectorAll("a") ?? []);
  const suivant = links.find((a) => /suivant/i.test(a.textContent ?? ""));
  assert.ok(suivant, "lien Suivant absent");
  assert.ok(suivant?.getAttribute("href")?.includes("offset=20"), "offset suivant incorrect");
});

test("pagination : Précédent affiché si offset > 0, Suivant absent si nextOffset null", async () => {
  const page2 = { items: [FILE], limit: 20, offset: 20, nextOffset: null };
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: page2 } }) as unknown as typeof fetch;
  const { container } = renderView({ limit: 20, offset: 20 });
  await waitFor(() => assert.ok(screen.queryByRole("list"), "liste absente"));
  const nav = container.querySelector("nav[aria-label='Pagination']");
  const links = Array.from(nav?.querySelectorAll("a") ?? []);
  const prev = links.find((a) => /précédent/i.test(a.textContent ?? ""));
  const next = links.find((a) => /suivant/i.test(a.textContent ?? ""));
  assert.ok(prev, "lien Précédent absent");
  assert.equal(next, undefined, "lien Suivant ne devrait pas être présent");
  assert.ok(prev?.getAttribute("href")?.includes("offset=0"), "offset précédent incorrect");
});

test("pagination : aucun lien si première page et nextOffset null", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } }) as unknown as typeof fetch;
  const { container } = renderView({ limit: 20, offset: 0 });
  await waitFor(() => assert.ok(screen.queryByRole("list"), "liste absente"));
  const nav = container.querySelector("nav[aria-label='Pagination']");
  const paginationLinks = Array.from(nav?.querySelectorAll("a") ?? []);
  assert.equal(paginationLinks.length, 0, "aucun lien de pagination attendu");
});
