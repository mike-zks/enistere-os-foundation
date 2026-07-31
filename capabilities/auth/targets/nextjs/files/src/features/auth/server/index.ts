// =============================================================================
// SERVER-ONLY — point d'entrée des clients API authentifiés (BFF).
// Importe `next/headers` (interdit côté client). EXCLU de `tsconfig.test.json`.
// FONDATIONS uniquement : ces helpers seront appelés par les futurs Route Handlers (Web Auth 2).
// Aucun appel réseau, aucun refresh réel n'est déclenché à ce stade.
// =============================================================================
import type { EnistereApiClient } from "@enistere/api-client-fetch";

import {
  createAuthenticatedServerApiClient,
  type AuthClientMode,
} from "../api/create-authenticated-server-api-client.js";
import { resolveCookieEnv } from "../cookie-config.js";
import { createNextCookieStore } from "./next-cookie-store.js";

async function createClient(mode: AuthClientMode): Promise<EnistereApiClient> {
  const cookieStore = await createNextCookieStore();
  return createAuthenticatedServerApiClient({ cookieStore, mode, env: resolveCookieEnv() });
}

/**
 * Client authentifié **lecture seule** (Server Component) : refresh **désactivé** (aucune écriture
 * cookie possible). Lit le Bearer depuis le cookie d'access.
 */
export function getReadOnlyAuthApiClient(): Promise<EnistereApiClient> {
  return createClient("read-only");
}

/**
 * Client authentifié **écriture** (Route Handler / Server Action) : refresh **activable** (les
 * nouveaux tokens peuvent être posés en cookies). Aucun refresh réel n'est déclenché en Web Auth 1.
 */
export function getWritableAuthApiClient(): Promise<EnistereApiClient> {
  return createClient("writable");
}
