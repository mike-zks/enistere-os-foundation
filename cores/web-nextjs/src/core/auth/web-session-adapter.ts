import type { AuthSessionAdapter, AuthTokens } from "@enistere/api-client-fetch";

import {
  buildAuthCookieOptions,
  cookieName,
  CookieConfigError,
  type CookieEnv,
} from "./cookie-config.js";
import type { ServerCookieStore } from "./server-cookie-store.js";

export interface WebAuthSessionAdapterOptions {
  readonly cookieStore: ServerCookieStore;
  readonly env: CookieEnv;
}

// Rejette un token vide ou contenant des caractères de contrôle (anti-injection d'en-tête).
// Construit via RegExp(string) pour n'employer que des caractères imprimables dans la source.
const CONTROL_CHARS = new RegExp("[\\x00-\\x1F\\x7F]");

function assertValidToken(token: string, label: string): void {
  if (typeof token !== "string" || token.trim() === "") {
    throw new CookieConfigError(`Token ${label} vide.`);
  }
  if (CONTROL_CHARS.test(token)) {
    throw new CookieConfigError(`Token ${label} invalide (caractère de contrôle).`);
  }
}

/**
 * Implémentation **serveur** de `AuthSessionAdapter` (BFF Web) au-dessus d'un `ServerCookieStore`.
 *
 * - lit/écrit **deux cookies distincts** (`access` / `refresh`), `HttpOnly` ;
 * - n'écrit **aucun log** et ne renvoie **jamais** de valeur de token au navigateur ;
 * - **ne déclenche aucun refresh par elle-même** (le refresh coordonné est géré par le client API,
 *   uniquement en mode « writable »).
 *
 * ⚠️ **Limite (absence de transaction cookie)** : `updateTokens` pose l'access **puis** le refresh ;
 * si la seconde écriture échoue, la première reste posée. Le code appelant (futurs Route Handlers)
 * doit `clearSession()` en cas d'échec partiel. Documenté dans `docs/auth-architecture.md`.
 */
export class WebAuthSessionAdapter implements AuthSessionAdapter {
  private readonly store: ServerCookieStore;
  private readonly env: CookieEnv;

  constructor(options: WebAuthSessionAdapterOptions) {
    this.store = options.cookieStore;
    this.env = options.env;
  }

  async getAccessToken(): Promise<string | null> {
    return this.store.get(cookieName("access", this.env)) ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.store.get(cookieName("refresh", this.env)) ?? null;
  }

  async updateTokens(tokens: AuthTokens): Promise<void> {
    assertValidToken(tokens.accessToken, "access");
    assertValidToken(tokens.refreshToken, "refresh");

    const accessOptions = buildAuthCookieOptions(this.env, tokens.accessTokenExpiresIn);
    const refreshOptions = buildAuthCookieOptions(this.env, tokens.refreshTokenExpiresIn);

    await this.store.set(cookieName("access", this.env), tokens.accessToken, accessOptions);
    await this.store.set(cookieName("refresh", this.env), tokens.refreshToken, refreshOptions);
  }

  /** Supprime les deux cookies de session. Idempotent (aucune erreur si déjà absents). */
  async clearSession(): Promise<void> {
    await this.store.delete(cookieName("access", this.env));
    await this.store.delete(cookieName("refresh", this.env));
  }
}
