import type { ServerCookieStore } from "./server-cookie-store.js";

/**
 * Vue **lecture seule** d'un stockage cookie serveur. N'expose **que** `get` : un contexte de résolution
 * de session (Server Component) ne doit pas pouvoir écrire de cookie (aucune rotation/`Set-Cookie`
 * pendant le rendu). La défense repose d'abord sur le **type** (aucune méthode d'écriture exposée), puis
 * sur la garde `guardReadOnly` (lève si une écriture est tentée malgré tout).
 */
export interface ReadOnlyServerCookieStore {
  get(name: string): string | undefined;
}

/** Levée si une écriture est tentée sur un store gardé en lecture seule (ne devrait jamais arriver). */
export class ReadOnlyCookieViolationError extends Error {
  constructor(operation: "set" | "delete") {
    super(`Écriture cookie interdite en lecture seule (${operation}).`);
    this.name = "ReadOnlyCookieViolationError";
  }
}

/**
 * Adapte une vue lecture seule en `ServerCookieStore` complet dont `set`/`delete` **lèvent**. Permet de
 * réutiliser les factories existantes (`createAuthenticatedServerApiClient`) tout en garantissant qu'aucune
 * écriture ne se produit pendant une résolution `read-only` (`enableRefresh:false` ne devrait rien écrire).
 */
export function guardReadOnly(store: ReadOnlyServerCookieStore): ServerCookieStore {
  return {
    get(name: string): string | undefined {
      return store.get(name);
    },
    set(): never {
      throw new ReadOnlyCookieViolationError("set");
    },
    delete(): never {
      throw new ReadOnlyCookieViolationError("delete");
    },
  };
}

/** Vue lecture seule **en mémoire** — TESTS UNIQUEMENT (aucune sémantique HTTP). */
export function inMemoryReadOnlyCookieStore(
  entries: Readonly<Record<string, string>> = {},
): ReadOnlyServerCookieStore {
  const map = new Map<string, string>(Object.entries(entries));
  return {
    get(name: string): string | undefined {
      return map.get(name);
    },
  };
}
