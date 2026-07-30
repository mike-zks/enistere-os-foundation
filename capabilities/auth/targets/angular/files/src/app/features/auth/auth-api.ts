import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_BASE_URL } from '../../core/config/api-config';
import { AuthError, GENERIC_CREDENTIALS_MESSAGE, GENERIC_UNAVAILABLE_MESSAGE } from './auth-errors';
import type { AuthSession } from './auth-session';

/**
 * Marks a request as belonging to authentication itself.
 *
 * The auth interceptor reads it to leave these calls alone: retrying a failed
 * refresh through the very interceptor that triggered it is how a client ends up
 * in an infinite refresh loop.
 */
export const AUTH_ENDPOINT = new HttpContextToken<boolean>(() => false);

function authContext(): HttpContext {
  return new HttpContext().set(AUTH_ENDPOINT, true);
}

/** Talks to the authority. Holds no state and decides nothing about sessions. */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = inject(APP_BASE_URL);

  async login(email: string, password: string): Promise<AuthSession> {
    return this.#call('/api/v1/auth/login', { email, password }, GENERIC_CREDENTIALS_MESSAGE);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    return this.#call('/api/v1/auth/refresh', { refreshToken }, GENERIC_UNAVAILABLE_MESSAGE);
  }

  /**
   * Best-effort remote revocation. The caller purges locally whatever happens:
   * an unreachable authority must never trap a user in a signed-in state.
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await firstValueFrom(this.#http.post(`${this.#baseUrl}/api/v1/auth/logout`,
        { refreshToken }, { context: authContext() }));
    } catch {
      // Deliberately swallowed — see the contract above.
    }
  }

  async #call(path: string, body: unknown, failureMessage: string): Promise<AuthSession> {
    try {
      return await firstValueFrom(this.#http.post<AuthSession>(
        `${this.#baseUrl}${path}`, body, { context: authContext() },
      ));
    } catch (error: unknown) {
      // The response body may carry the reason; it is not surfaced. Only the
      // correlation id crosses, so a support request stays traceable without
      // telling the caller which part of the credential was wrong.
      const requestId = extractRequestId(error);
      throw new AuthError(failureMessage, requestId);
    }
  }
}

function extractRequestId(error: unknown): string | null {
  const candidate = (error as { error?: { requestId?: unknown } })?.error?.requestId;
  return typeof candidate === 'string' ? candidate : null;
}
