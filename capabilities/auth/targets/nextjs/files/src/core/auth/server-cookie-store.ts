import type { CookieAttributes } from "./cookie-config.js";

/**
 * Abstraction de stockage cookie **serveur** (indépendante de Next et des tests).
 *
 * - `get` : lecture synchrone d'une valeur de cookie.
 * - `set`/`delete` : peuvent être synchrones ou asynchrones selon l'adaptateur. En **Server Component**,
 *   `set`/`delete` lèvent (lecture seule) — c'est attendu ; les écritures n'ont lieu qu'en Route
 *   Handler / Server Action.
 */
export interface ServerCookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieAttributes): void | Promise<void>;
  delete(name: string): void | Promise<void>;
}

/**
 * Stockage cookie **EN MÉMOIRE** — TESTS UNIQUEMENT. Ne jamais utiliser en production
 * (aucune persistance, aucune sémantique HTTP). N'est exporté par aucun point d'entrée de production.
 */
export class InMemoryCookieStore implements ServerCookieStore {
  private readonly values = new Map<string, string>();

  get(name: string): string | undefined {
    return this.values.get(name);
  }

  set(name: string, value: string, _options: CookieAttributes): void {
    this.values.set(name, value);
  }

  delete(name: string): void {
    this.values.delete(name);
  }

  /** Aide de test : un cookie est-il présent ? (présence uniquement, jamais la valeur en clair ailleurs). */
  has(name: string): boolean {
    return this.values.has(name);
  }

  /** Aide de test : noms des cookies présents. */
  names(): string[] {
    return [...this.values.keys()];
  }
}
