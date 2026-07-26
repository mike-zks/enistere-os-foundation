import assert from "node:assert/strict";
import { test } from "node:test";

import { required, validateForm } from "../src/core/platform/form-foundation.js";

test("form foundation validates typed fields without owning business rules", () => {
  const errors = validateForm(
    { email: " ", count: 2 },
    { email: required("Email"), count: (value) => value > 0 ? null : "invalide" },
  );
  assert.deepEqual(errors, { email: "Email est requis" });
});
