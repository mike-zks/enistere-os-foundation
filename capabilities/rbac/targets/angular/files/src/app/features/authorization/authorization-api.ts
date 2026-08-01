import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_BASE_URL } from '../../core/config/api-config';
import type { AuthorizationSummary } from './authorization-summary';

interface ApiSuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly timestamp: string;
}

/** Client de lecture du résumé RBAC. L’intercepteur Auth porte la session. */
@Injectable({ providedIn: 'root' })
export class AuthorizationApi {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = inject(APP_BASE_URL);

  getSummary(): Promise<AuthorizationSummary> {
    return firstValueFrom(this.#http.get<ApiSuccessEnvelope<AuthorizationSummary>>(
      `${this.#baseUrl}/api/v1/auth/me/authorization`,
    )).then((envelope) => envelope.data);
  }
}
