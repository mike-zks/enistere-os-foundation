// =============================================================================
// SERVER-ONLY — résolution de session pour les espaces protégés (Server Components).
// Importe `next/headers` (interdit côté client). EXCLU de `tsconfig.test.json` : la logique testable
// (classification, politique de rendu) vit dans `core/auth/resolve-server-session.ts` (deps injectées).
// =============================================================================
import { headers } from "next/headers";

import { resolveCookieEnv } from "../cookie-config.js";
import { resolveRequestId } from "../request-id.js";
import {
  resolveServerSession,
  type ServerSessionResolution,
} from "../resolve-server-session.js";
import { createReadOnlyNextCookieStore } from "./next-cookie-store.js";

/**
 * Résout la session courante depuis le contexte Next (Server Component) : request id entrant éventuel
 * (`x-request-id`), cookies en **lecture seule**, environnement. Délègue la logique read-only/classification
 * à `resolveServerSession` (appel **direct** à l'API NestJS `/auth/me`, jamais le BFF local). Aucun token.
 */
export async function resolveNextServerSession(): Promise<ServerSessionResolution> {
  const [headerList, cookieStore] = await Promise.all([headers(), createReadOnlyNextCookieStore()]);
  const requestId = resolveRequestId(headerList.get("x-request-id"));
  return resolveServerSession({ cookieStore, env: resolveCookieEnv(), requestId });
}
