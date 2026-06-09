import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_THEME, THEME_ATTRIBUTE } from "../src/core/config/theme.js";

test("thème par défaut = light", () => {
  assert.equal(DEFAULT_THEME, "light");
});

test("attribut de thème = data-theme", () => {
  assert.equal(THEME_ATTRIBUTE, "data-theme");
});
