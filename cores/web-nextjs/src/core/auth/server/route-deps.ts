// =============================================================================
// SERVER-ONLY — assemble les dépendances des handlers Auth depuis `next/headers`.
// EXCLU de `tsconfig.test.json` (les handlers sont testés avec des deps injectées).
// =============================================================================
import type { AuthHandlerDeps } from "../handlers/types.js";
import { resolveCookieEnv } from "../cookie-config.js";
import { parseAllowedOrigins } from "../http/allowed-origins.js";
import { createNextCookieStore } from "./next-cookie-store.js";

/** Construit les dépendances d'un handler Auth pour une requête (cookies Next, env, origines). */
export async function buildAuthHandlerDeps(): Promise<AuthHandlerDeps> {
  return {
    cookieStore: await createNextCookieStore(),
    env: resolveCookieEnv(),
    allowedOrigins: parseAllowedOrigins(),
  };
}
