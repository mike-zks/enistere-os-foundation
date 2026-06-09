// =============================================================================
// SERVER-ONLY. N'importez JAMAIS ce module depuis un Client Component.
// La garantie repose ici sur l'import de `next/headers` (interdit côté client par Next : erreur de
// build) + les tests de frontière statiques. Le paquet `server-only` n'est PAS utilisé car il lève à
// l'import sous `node:test` (cf. README) ; ce module est en conséquence EXCLU de `tsconfig.test.json`.
// =============================================================================
import { cookies } from "next/headers";

import type { ServerCookieStore } from "../server-cookie-store.js";

/**
 * Construit un `ServerCookieStore` à partir de l'API Next `cookies()` (asynchrone en Next 16).
 *
 * - **Server Component** : seul `get` est utilisable ; `set`/`delete` lèvent (lecture seule) — c'est
 *   le comportement attendu de Next.
 * - **Route Handler / Server Action** : `get`/`set`/`delete` sont disponibles.
 */
export async function createNextCookieStore(): Promise<ServerCookieStore> {
  const jar = await cookies();
  return {
    get(name) {
      return jar.get(name)?.value;
    },
    set(name, value, options) {
      jar.set(name, value, options);
    },
    delete(name) {
      jar.delete(name);
    },
  };
}
