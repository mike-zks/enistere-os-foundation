import { CSRF_COOKIE_NAME, type CookieAttributes, type CookieEnv } from "../cookie-config.js";

/** Durée de vie du cookie CSRF (4 h). Renouvelé à chaque `/api/auth/csrf`, login et refresh. */
export const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 4;

/** Nom du cookie CSRF (préfixe `__Host-` en production, comme les cookies Auth). */
export function csrfCookieName(env: CookieEnv): string {
  return env === "production" ? `__Host-${CSRF_COOKIE_NAME}` : CSRF_COOKIE_NAME;
}

/**
 * Attributs du cookie CSRF : **`httpOnly: false`** (lisible par le JS navigateur — c'est le seul
 * cookie volontairement lisible, pour le double-submit), `Secure` en production, `SameSite=Lax`,
 * `Path=/`, aucun `Domain`. Ne contient **aucun** secret d'authentification.
 */
export function buildCsrfCookieOptions(env: CookieEnv): CookieAttributes {
  return {
    httpOnly: false,
    secure: env === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
    priority: "medium",
  };
}
