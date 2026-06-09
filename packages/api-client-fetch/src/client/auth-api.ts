/**
 * Façade d'authentification typée (routes publiques sans refresh-retry ; profil/autorisations protégés).
 */
import type { SchemaOf } from '@enistere/api-contracts';

import { ApiClientError } from '../errors/api-client-error.js';
import { toApiClientError } from '../errors/error-normalizer.js';
import type { Transport } from './transport.js';

export class AuthApi {
  constructor(private readonly t: Transport) {}

  async login(email: string, password: string): Promise<SchemaOf<'LoginResponseDto'>> {
    const result = await this.t.invoke((signal) =>
      this.t.raw.POST('/auth/login', { body: { email, password }, signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    const payload = result.data.data;
    await this.t.session?.updateTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      accessTokenExpiresIn: payload.accessTokenExpiresIn,
      refreshTokenExpiresIn: payload.refreshTokenExpiresIn,
      tokenType: payload.tokenType,
    });
    return payload;
  }

  /** Refresh explicite (met à jour les tokens via l'adaptateur). */
  refresh(): Promise<SchemaOf<'RefreshResponseDto'>> {
    return this.t.performRefresh();
  }

  async logout(): Promise<SchemaOf<'LogoutResponseDto'>> {
    const refreshToken = (await this.t.session?.getRefreshToken()) ?? null;
    if (!refreshToken) {
      await this.t.safeClear();
      return { status: 'logged_out' };
    }
    const result = await this.t.invoke((signal) =>
      this.t.raw.POST('/auth/logout', { body: { refreshToken }, signal }),
    );
    // Nettoyage local délégué à l'adaptateur, appliqué quoi qu'il arrive (logout idempotent serveur).
    await this.t.safeClear();
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }

  async getProfile(): Promise<SchemaOf<'UserProfileResponseDto'>> {
    const result = await this.t.invokeRefreshable((signal) => this.t.raw.GET('/auth/me', { signal }));
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }

  async getAuthorization(): Promise<SchemaOf<'AuthorizationSummaryResponseDto'>> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.GET('/auth/me/authorization', { signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }
}
