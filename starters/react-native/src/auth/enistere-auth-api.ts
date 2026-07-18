/**
 * EnistereAuthApi — the REAL {@link AuthApi}, backed by the official
 * `@enistere/api-client-fetch` typed client (ADR-016).
 *
 * It implements the AuthEngine's `AuthApi` seam by POSTing to API Core
 * `/auth/login` and `/auth/refresh` through the typed `client.raw`
 * (openapi-fetch, contract = `@enistere/api-contracts`), then mapping the
 * response to {@link AuthSessionData} via {@link toAuthSessionData}.
 *
 * The AuthEngine remains the session brain: it calls `login`/`refresh`, applies
 * the returned tokens (access in memory, refresh in SecureStore), and owns the
 * coalesced refresh + state machine. This adapter performs only the single typed
 * network exchange. Failures throw a generic {@link AuthApiError} — NO token,
 * status, or response body is leaked into the error.
 *
 * The `EnistereApiClient` import is TYPE-ONLY; the concrete client is injected.
 */
import type { EnistereApiClient } from '@enistere/api-client-fetch';

import { AuthApiError } from './auth-api';
import type { AuthApi, AuthSessionData } from './auth-api';
import type { SignInInput } from './session';
import { toAuthSessionData } from './token-mapping';

export class EnistereAuthApi implements AuthApi {
  constructor(
    private readonly client: EnistereApiClient,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async login(input: SignInInput): Promise<AuthSessionData> {
    const { data, error } = await this.client.raw.POST('/auth/login', {
      body: { email: input.email, password: input.password ?? '' },
    });
    if (error !== undefined || data === undefined) {
      throw new AuthApiError('Login failed.');
    }
    return toAuthSessionData(data.data, this.now());
  }

  async refresh(refreshToken: string): Promise<AuthSessionData> {
    const { data, error } = await this.client.raw.POST('/auth/refresh', {
      body: { refreshToken },
    });
    if (error !== undefined || data === undefined) {
      throw new AuthApiError('Refresh failed.');
    }
    return toAuthSessionData(data.data, this.now());
  }
}
