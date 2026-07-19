import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createElement } from "react";

import { UploadForm } from "../src/features/files/upload-form.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const UPLOADED = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  originalName: "test.jpg",
  mimeType: "image/jpeg",
  extension: "jpg",
  size: "100",
  category: "IMAGE",
  status: "PENDING",
  visibility: "PRIVATE",
  createdAt: "t",
  updatedAt: "t",
};

const JPEG = new File(["x"], "test.jpg", { type: "image/jpeg" });
const ORIG = globalThis.fetch;
const open: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function setup() {
  const client = createTestQueryClient();
  open.push(client);
  const mock = createBrowserFetch((url) => {
    if (url.includes("/api/auth/csrf")) return { body: { success: true, data: { csrfToken: "tok" } } };
    if (url.includes("/api/files/upload")) return { body: { success: true, data: UPLOADED } };
    return { status: 404, body: { success: false, errorCode: "NOT_FOUND" } };
  });
  globalThis.fetch = mock as unknown as typeof fetch;
  render(createElement(createWrapper(client), null, createElement(UploadForm, null)));
  return { client, mock };
}

test("fichier requis : soumission sans sélection → erreur visible", async () => {
  setup();
  await act(async () => {
    await userEvent.setup().click(screen.getByRole("button", { name: "Envoyer" }));
  });
  await waitFor(() => {
    assert.ok(screen.getByText("Fichier requis."));
  });
});

test("catégorie requise : soumission sans catégorie → erreur visible", async () => {
  setup();
  const user = userEvent.setup();
  const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
  await act(async () => {
    await user.upload(fileInput, JPEG);
    await user.click(screen.getByRole("button", { name: "Envoyer" }));
  });
  await waitFor(() => {
    assert.ok(screen.getByText("Catégorie requise."));
  });
  assert.equal(screen.queryByText("Fichier requis."), null);
});

test("référence trop longue : soumission → erreur visible", async () => {
  setup();
  const user = userEvent.setup();
  const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
  const categorySelect = document.querySelector("select[name='category']") as HTMLSelectElement;
  const subjectIdInput = document.querySelector("input[name='subjectId']") as HTMLInputElement;
  await act(async () => {
    await user.upload(fileInput, JPEG);
    fireEvent.change(categorySelect, { target: { value: "IMAGE" } });
    fireEvent.change(subjectIdInput, { target: { value: "a".repeat(129) } });
    await user.click(screen.getByRole("button", { name: "Envoyer" }));
  });
  await waitFor(() => {
    assert.ok(screen.getByText("Maximum 128 caractères."));
  });
});

test("succès : fichier + catégorie valides → section succès affichée, upload appelé", async () => {
  const { mock } = setup();
  const user = userEvent.setup();
  const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
  const categorySelect = document.querySelector("select[name='category']") as HTMLSelectElement;
  await act(async () => {
    await user.upload(fileInput, JPEG);
    fireEvent.change(categorySelect, { target: { value: "IMAGE" } });
    await user.click(screen.getByRole("button", { name: "Envoyer" }));
  });
  await waitFor(() => {
    assert.ok(screen.getByRole("region", { name: "Fichier envoyé" }));
  });
  assert.ok(mock.calls.some((c) => c.url.includes("/api/files/upload")));
});
