import { cookieName, type CookieEnv } from "./cookie-config.js";
import type { ServerCookieStore } from "./server-cookie-store.js";

/**
 * Contrat de session Web **interne au serveur**.
 *
 * ⚠️ Ne doit **jamais** être sérialisé ni renvoyé au navigateur. Les `expiresAt` ne sont pas stockés
 * dans les cookies (seul le `maxAge` l'est, via les attributs) : ils restent `null` ici tant qu'une
 * source dédiée ne les fournit pas — ce contrat sert de forme cible et de base aux diagnostics.
 */
export interface WebAuthSession {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly accessTokenExpiresAt: number | null;
  readonly refreshTokenExpiresAt: number | null;
}

/**
 * Diagnostic **sans valeur sensible** : indique seulement la **présence** des cookies de session.
 * Aucune valeur de token n'est exposée (utilisable pour des logs/observabilité ultérieurs).
 */
export interface SessionPresence {
  readonly accessPresent: boolean;
  readonly refreshPresent: boolean;
}

export function sessionPresence(store: ServerCookieStore, env: CookieEnv): SessionPresence {
  return {
    accessPresent: store.get(cookieName("access", env)) !== undefined,
    refreshPresent: store.get(cookieName("refresh", env)) !== undefined,
  };
}
