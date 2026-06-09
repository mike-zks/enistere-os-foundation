/**
 * Transport interne partagé par les façades de domaine : timeout, refresh COORDONNÉ (single-flight)
 * + rejeu unique sur 401. Centralise la logique réseau pour que `auth`/`files` restent de simples
 * façades typées.
 */
import type { paths, SchemaOf } from '@enistere/api-contracts';
import type { Client } from 'openapi-fetch';

import type { AuthSessionAdapter } from '../auth/auth-session-adapter.js';
import { SingleFlight } from '../auth/refresh-coordinator.js';
import { ApiClientError } from '../errors/api-client-error.js';
import { readRequestId, toApiClientError } from '../errors/error-normalizer.js';
import { withTimeout } from '../request/timeout.js';

export type ApiResult = { data?: unknown; error?: unknown; response: Response };

export class Transport {
  private readonly refreshFlight = new SingleFlight<boolean>();

  constructor(
    readonly raw: Client<paths>,
    readonly session: AuthSessionAdapter | undefined,
    private readonly timeoutMs: number,
    readonly refreshEnabled: boolean,
  ) {}

  /** Appel SANS refresh (routes publiques : login/refresh/logout). */
  invoke<R>(fn: (signal: AbortSignal) => Promise<R>): Promise<R> {
    return withTimeout(fn, this.timeoutMs);
  }

  /** Appel protégé : sur 401, refresh coordonné puis rejeu UNIQUE (jamais de boucle). */
  async invokeRefreshable<R extends ApiResult>(fn: (signal: AbortSignal) => Promise<R>): Promise<R> {
    let result = await withTimeout(fn, this.timeoutMs);
    if (result.response.status === 401 && this.refreshEnabled) {
      const refreshed = await this.coordinateRefresh();
      if (!refreshed) {
        throw ApiClientError.sessionExpired(readRequestId(result.response));
      }
      result = await withTimeout(fn, this.timeoutMs);
    }
    return result;
  }

  /** Single-flight : N 401 concurrents ⇒ un seul `/auth/refresh`. */
  coordinateRefresh(): Promise<boolean> {
    return this.refreshFlight.run(() => this.performRefreshBoolean());
  }

  private async performRefreshBoolean(): Promise<boolean> {
    try {
      await this.performRefresh();
      return true;
    } catch {
      await this.safeClear();
      return false;
    }
  }

  /** Refresh explicite : POST /auth/refresh + updateTokens ; renvoie le payload typé. */
  async performRefresh(): Promise<SchemaOf<'RefreshResponseDto'>> {
    if (!this.session) {
      throw ApiClientError.sessionExpired(null);
    }
    const refreshToken = await this.session.getRefreshToken();
    if (!refreshToken) {
      throw ApiClientError.sessionExpired(null);
    }
    const result = await withTimeout(
      (signal) => this.raw.POST('/auth/refresh', { body: { refreshToken }, signal }),
      this.timeoutMs,
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.sessionExpired(readRequestId(result.response));
    }
    const tokens = result.data.data;
    await this.session.updateTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
      tokenType: tokens.tokenType,
    });
    return tokens;
  }

  async safeClear(): Promise<void> {
    try {
      await this.session?.clearSession();
    } catch {
      // nettoyage best-effort
    }
  }

  requestId(response: Response): string | null {
    return readRequestId(response);
  }
}
