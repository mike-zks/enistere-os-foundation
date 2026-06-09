import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render } from "@testing-library/react";
import { axe } from "jest-axe";

import { FoundationStatus } from "../src/features/foundation-status/foundation-status.js";
import { LoadingState } from "../src/shared/components/loading-state.js";
import { ErrorState } from "../src/shared/components/error-state.js";
import { NotFoundState } from "../src/shared/components/not-found-state.js";

afterEach(() => {
  cleanup();
});

// `region` est une règle de niveau page — non pertinente pour un fragment rendu en test.
const axeOptions = { rules: { region: { enabled: false } } } as const;

async function expectNoViolations(container: Element): Promise<void> {
  const results = await axe(container, axeOptions);
  assert.equal(
    results.violations.length,
    0,
    `violations: ${results.violations.map((v) => v.id).join(", ")}`,
  );
}

test("FoundationStatus — aucune violation a11y évidente", async () => {
  const { container } = render(<FoundationStatus />);
  await expectNoViolations(container);
});

test("LoadingState — aucune violation", async () => {
  const { container } = render(<LoadingState />);
  await expectNoViolations(container);
});

test("ErrorState — aucune violation", async () => {
  const { container } = render(<ErrorState onReset={() => {}} />);
  await expectNoViolations(container);
});

test("NotFoundState — aucune violation", async () => {
  const { container } = render(<NotFoundState />);
  await expectNoViolations(container);
});
