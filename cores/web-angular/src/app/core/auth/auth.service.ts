import { Injectable, signal } from '@angular/core';
import type { AuthState } from './auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _authState = signal<AuthState>('unauthenticated');
  private readonly _accessToken = signal<string | null>(null);

  readonly authState = this._authState.asReadonly();

  getAccessToken(): string | null {
    return this._accessToken();
  }

  isAuthenticated(): boolean {
    return this.authState() === 'authenticated';
  }

  login(_email: string, _password: string): void {
    this._authState.set('loading');
    // Placeholder: stores a synthetic token in memory only — no API call, no persistence.
    // Replace with real POST /api/v1/auth/login in Angular 4+ mission.
    this._accessToken.set('placeholder-memory-token');
    this._authState.set('authenticated');
  }

  logout(): void {
    this._accessToken.set(null);
    this._authState.set('unauthenticated');
  }

  restoreSession(): void {
    // No persistent storage in this mission — always cold-start unauthenticated.
    // RefreshInterceptor with cookie HttpOnly strategy is deferred to Angular 4+.
    this._authState.set('unauthenticated');
  }
}
