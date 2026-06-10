import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { isSafeDownloadUrl, triggerDownload } from "../src/core/files/download.js";

afterEach(() => {
  document.body.innerHTML = "";
});

test("isSafeDownloadUrl : https ok ; http seulement si insecure ; schémas dangereux refusés", () => {
  assert.ok(isSafeDownloadUrl("https://storage.test/x?sig=A"));
  assert.equal(isSafeDownloadUrl("http://localhost:9000/x"), false);
  assert.ok(isSafeDownloadUrl("http://localhost:9000/x", true));
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "/relative", "pas une url", "ftp://x/y"]) {
    assert.equal(isSafeDownloadUrl(bad), false, bad);
  }
});

test("triggerDownload : ancre temporaire rel=noopener noreferrer, nettoyée, rien ne reste dans le DOM", () => {
  let clickedHref = "";
  let clickedRel = "";
  const original = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement): void {
    clickedHref = this.href;
    clickedRel = this.rel;
  };
  try {
    const ok = triggerDownload("https://storage.test/obj?X-Amz-Signature=ABC");
    assert.equal(ok, true);
    assert.ok(clickedHref.includes("https://storage.test/obj"));
    assert.equal(clickedRel, "noopener noreferrer");
    assert.equal(document.querySelectorAll("a").length, 0, "ancre retirée après clic");
  } finally {
    HTMLAnchorElement.prototype.click = original;
  }
});

test("triggerDownload : URL dangereuse refusée (aucune ancre, retourne false)", () => {
  assert.equal(triggerDownload("javascript:alert(1)"), false);
  assert.equal(triggerDownload("http://insecure.test/x"), false); // http sans allowInsecure
  assert.equal(document.querySelectorAll("a").length, 0);
});

test("triggerDownload : http autorisé en contexte insecure (MinIO local)", () => {
  const original = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function noop(): void {};
  try {
    assert.equal(triggerDownload("http://localhost:9000/obj?sig=A", { allowInsecure: true }), true);
  } finally {
    HTMLAnchorElement.prototype.click = original;
  }
});
