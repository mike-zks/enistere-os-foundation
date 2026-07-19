import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { AuthorizationStatusView } from "../src/features/authorization/authorization-status-view.js";

afterEach(() => {
  cleanup();
});

test("AuthorizationStatusView — masqué si non visible", () => {
  render(<AuthorizationStatusView visible={false} roleCount={3} permissionCount={5} />);
  assert.equal(screen.queryByText(/Autorisations/), null);
});

test("AuthorizationStatusView — compte rôles/permissions", () => {
  render(<AuthorizationStatusView visible roleCount={2} permissionCount={5} />);
  assert.ok(screen.getByText(/2 rôle\(s\)/));
  assert.ok(screen.getByText(/5 permission\(s\)/));
});
