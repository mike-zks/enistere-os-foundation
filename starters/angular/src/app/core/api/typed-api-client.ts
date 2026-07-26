import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_BASE_URL } from '../config/api-config';

export interface HealthResponse {
  readonly status: 'ok' | 'live' | 'ready';
  readonly timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class TypedApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_BASE_URL);

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }
}
