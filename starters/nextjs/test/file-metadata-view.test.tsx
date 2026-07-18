import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { axe } from "jest-axe";

import { FileMetadataView } from "../src/features/files/file-metadata-view.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;
const FILE = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
  originalName: "photo.jpg",
  mimeType: "image/jpeg",
  extension: "jpg",
  size: "1048576",
  category: "IMAGE" as const,
  status: "VALIDATED" as const,
  visibility: "PRIVATE" as const,
  createdAt: "2026-06-09T12:00:00.000Z",
  updatedAt: "2026-06-09T12:00:00.000Z",
};

test("affiche les métadonnées publiques formatées (h1 = nom, taille 1.0 MiB), aucun champ interne", async () => {
  const { container } = render(<FileMetadataView file={FILE} />);
  assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "photo.jpg");
  assert.ok(screen.getByText("image/jpeg"));
  assert.ok(screen.getByText("1.0 MiB"));
  assert.ok(screen.getByText("VALIDATED"));
  const dump = container.innerHTML.toLowerCase();
  for (const internal of ["storagekey", "bucket", "checksum", "ownerid", "x-amz"]) {
    assert.ok(!dump.includes(internal), internal);
  }
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
});

test("bouton Télécharger affiché si canDownload, déclenche onDownload", async () => {
  let clicks = 0;
  render(<FileMetadataView file={FILE} canDownload onDownload={() => (clicks += 1)} />);
  await userEvent.setup().click(screen.getByRole("button", { name: /télécharger/i }));
  assert.equal(clicks, 1);
});

test("aucun bouton si canDownload est faux", () => {
  render(<FileMetadataView file={FILE} canDownload={false} onDownload={() => {}} />);
  assert.equal(screen.queryByRole("button", { name: /télécharger/i }), null);
});

test("erreur de téléchargement (409) affichée en alerte générique", async () => {
  const { container } = render(
    <FileMetadataView file={FILE} canDownload onDownload={() => {}} downloadError="Ce fichier n'est pas téléchargeable." />,
  );
  assert.ok(screen.getByRole("alert").textContent?.includes("téléchargeable"));
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
});
