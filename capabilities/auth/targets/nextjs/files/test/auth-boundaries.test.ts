import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function source(relFromSrc: string): string {
  // build-test/test/x.js -> ../../ = racine web-nextjs -> src/...
  return readFileSync(new URL(`../../src/${relFromSrc}`, import.meta.url), "utf8");
}

// Modules atteignables côté navigateur (Client Components / client public / hooks / providers).
const CLIENT_REACHABLE = [
  "core/api/public/public-api-client.ts",
  "core/api/run-public-request.ts",
  "core/api/health/health-transport.ts",
  "core/api/errors/map-api-error.ts",
  "features/health/use-health.ts",
  "features/health/health-panel.tsx",
  "features/health/health-probe-view.tsx",
  "core/query/query-provider.tsx",
  "app/providers/app-providers.tsx",
  // Surface Auth navigateur (Web Auth 3/4) : hooks, panneau, vues présentationnelles, état, client BFF.
  "features/auth/auth-queries.ts",
  "features/auth/use-session.ts",
  "features/auth/use-logout.ts",
  "features/auth/session-panel.tsx",
  "features/auth/service-unavailable-view.tsx",
  "features/auth/protected-notice.tsx",
  "features/auth/session-state.ts",
  "features/auth/client/auth-bff-client.ts",
  "features/auth/client/bff-error.ts",
  // Surface login navigateur (Web Auth 5). NB : `login-client.ts` est exclu de cette liste car sa
  // docstring cite `/api/auth/csrf` (faux positif du filtre par sous-chaîne) ; il est couvert par
  // `login-client.test.ts` (same-origin, aucun appel direct API).
  "features/auth/return-to.ts",
  "features/auth/login-validation.ts",
  "features/auth/login-error.ts",
  "features/auth/use-login.ts",
  "features/auth/login-form.tsx",
];

// Éléments serveur/sensibles qui ne doivent JAMAIS être importés par un module client.
const FORBIDDEN_IN_CLIENT = [
  "next/headers",
  "auth/server",
  "next-cookie-store",
  "cookie-config",
  "web-session-adapter",
  "server-cookie-store",
  "session-contract",
  "create-authenticated-server-api-client",
  "auth/handlers",
  "auth/csrf",
  "auth/http",
  "login-handler",
  "refresh-handler",
  "logout-handler",
  "csrf-token",
  // Résolution Auth serveur (Web Auth 4) : jamais atteignable depuis un module client.
  "resolve-server-session",
  "protected-session",
];

test("aucun module atteignable côté client n'importe un module serveur/sensible", () => {
  for (const mod of CLIENT_REACHABLE) {
    const src = source(mod);
    for (const forbidden of FORBIDDEN_IN_CLIENT) {
      assert.ok(
        !src.includes(forbidden),
        `${mod} ne doit pas référencer « ${forbidden} »`,
      );
    }
  }
});

test("les modules serveur Auth importent bien next/headers (frontière serveur)", () => {
  assert.ok(source("features/auth/server/next-cookie-store.ts").includes("next/headers"));
});

test("aucune variable NEXT_PUBLIC_ ne porte de token/secret", () => {
  for (const mod of [
    "core/config/public-config.ts",
    "core/api/public/public-api-client.ts",
    "features/auth/cookie-config.ts",
    "features/auth/web-session-adapter.ts",
  ]) {
    const src = source(mod);
    assert.ok(!/NEXT_PUBLIC_[A-Z_]*(TOKEN|SECRET|PASSWORD|KEY)/.test(src), `${mod} : NEXT_PUBLIC_ sensible`);
  }
});
