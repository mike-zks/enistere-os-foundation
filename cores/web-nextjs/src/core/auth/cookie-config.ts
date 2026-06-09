/**
 * Configuration des cookies d'authentification (BFF Web — ADR-004/005).
 *
 * Module **serveur** (logique pure, testable) : ne lit JAMAIS de token, ne dépend pas de `next/*`.
 * La pose réelle des cookies se fait via un `ServerCookieStore` (adaptateur `next/headers` séparé).
 *
 * Stratégie V1 :
 * - **access** et **refresh** : cookies **distincts**, `HttpOnly`, `SameSite=Lax`, `Path=/`, **sans
 *   Domain** (limite la portée), `Secure` en production uniquement.
 * - **Préfixe `__Host-`** en production (exige `Secure` + `Path=/` + pas de `Domain`) ; en
 *   développement/test (HTTP local), préfixe **omis** car `__Host-`/`Secure` y sont incompatibles.
 * - **Durées** issues de l'API (`accessTokenExpiresIn`/`refreshTokenExpiresIn`, en secondes) — jamais
 *   redupliquées arbitrairement.
 */

export type CookieEnv = "development" | "test" | "production";
export type AuthCookieKind = "access" | "refresh";
export type SameSitePolicy = "lax" | "strict" | "none";
export type CookiePriority = "low" | "medium" | "high";

/** Attributs d'un cookie (compatible `ServerCookieStore.set`). */
export interface CookieAttributes {
  // `true` pour les cookies Auth (access/refresh) ; `false` pour le cookie CSRF (lisible par le JS).
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: SameSitePolicy;
  readonly path: string;
  /** Durée de vie en **secondes** (fournie par l'API). */
  readonly maxAge: number;
  readonly domain?: string;
  readonly priority?: CookiePriority;
}

export class CookieConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CookieConfigError";
  }
}

const BASE_NAMES: Record<AuthCookieKind, string> = {
  access: "enistere_access",
  refresh: "enistere_refresh",
};

// Jeton RFC 6265 (token) : pas d'espaces, de séparateurs ni de caractères de contrôle.
const COOKIE_NAME_PATTERN = /^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/;

/** Détermine l'environnement de cookie depuis `APP_ENV`/`NODE_ENV`. */
export function resolveCookieEnv(): CookieEnv {
  const raw = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  if (raw === "production" || raw === "test") {
    return raw;
  }
  return "development";
}

/**
 * Nom de cookie selon l'environnement. En production : préfixe **`__Host-`** (durcissement). En
 * développement/test : nom de base (le préfixe `__Host-` exigerait `Secure`, indisponible en HTTP local).
 */
export function cookieName(kind: AuthCookieKind, env: CookieEnv): string {
  const base = BASE_NAMES[kind];
  const name = env === "production" ? `__Host-${base}` : base;
  assertValidCookieName(name);
  return name;
}

export function assertValidCookieName(name: string): void {
  if (!COOKIE_NAME_PATTERN.test(name)) {
    throw new CookieConfigError("Nom de cookie invalide.");
  }
}

/**
 * Vérifie la cohérence d'attributs de cookie (sécurité). Rejette : `maxAge` non fini/≤ 0,
 * `SameSite=None` sans `Secure`, et — pour un nom préfixé `__Host-` — l'absence de `Secure`/`Path=/`
 * ou la présence d'un `Domain`.
 */
export function assertValidCookieAttributes(name: string, attrs: CookieAttributes): void {
  if (!Number.isFinite(attrs.maxAge) || attrs.maxAge <= 0) {
    throw new CookieConfigError("Durée de cookie (maxAge) invalide.");
  }
  if (attrs.sameSite === "none" && !attrs.secure) {
    throw new CookieConfigError("SameSite=None exige Secure.");
  }
  if (name.startsWith("__Host-")) {
    if (!attrs.secure || attrs.path !== "/" || attrs.domain !== undefined) {
      throw new CookieConfigError("Préfixe __Host- : exige Secure, Path=/ et aucun Domain.");
    }
  }
}

/**
 * Construit les attributs d'un cookie d'authentification pour une durée (secondes) donnée. Valide la
 * cohérence (lève `CookieConfigError` sinon). `maxAge` est tronqué à l'entier inférieur.
 */
export function buildAuthCookieOptions(env: CookieEnv, maxAgeSeconds: number): CookieAttributes {
  if (!Number.isFinite(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new CookieConfigError("Durée de cookie (maxAge) invalide.");
  }
  const attrs: CookieAttributes = {
    httpOnly: true,
    secure: env === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(maxAgeSeconds),
    priority: "high",
  };
  return attrs;
}

// --- Cadrage CSRF (V1 : AUCUN mécanisme actif — noms réservés pour éviter une future duplication) ---
// Voir docs/auth-architecture.md §CSRF futur. Ne crée AUCUNE protection ici.
export const CSRF_COOKIE_NAME = "enistere_csrf";
export const CSRF_HEADER_NAME = "X-CSRF-Token";
