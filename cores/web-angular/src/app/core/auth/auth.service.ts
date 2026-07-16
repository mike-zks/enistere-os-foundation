import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { AuthApi } from './auth.api';
import type { AuthState } from './auth.state';
import { PermissionService } from '../permissions/permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly permissionService = inject(PermissionService);
  private readonly _authState = signal<AuthState>('unauthenticated');
  private readonly _accessToken = signal<string | null>(null);

  readonly authState = this._authState.asReadonly();

  private refreshInFlight$: Observable<string> | null = null;

  getAccessToken(): string | null {
    return this._accessToken();
  }

  isAuthenticated(): boolean {
    return this.authState() === 'authenticated';
  }

  login(email: string, password: string): Observable<void> {
    this._authState.set('loading');
    return this.api.login({ email, password }).pipe(
      tap((tokens) => {
        this._accessToken.set(tokens.accessToken);
        this._authState.set('authenticated');
      }),
      map(() => undefined as void),
      catchError((err: unknown) => {
        this._accessToken.set(null);
        this.permissionService.clear();
        this._authState.set('unauthenticated');
        return throwError(() => err);
      }),
    );
  }

  refreshSession(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    this._authState.set('refreshing');
    this.refreshInFlight$ = this.api.refresh().pipe(
      tap((tokens) => {
        this._accessToken.set(tokens.accessToken);
        this._authState.set('authenticated');
      }),
      map((tokens) => tokens.accessToken),
      catchError((err: unknown) => {
        this._authState.set('expired');
        this._accessToken.set(null);
        this.permissionService.clear();
        return throwError(() => err);
      }),
      finalize(() => { this.refreshInFlight$ = null; }),
      shareReplay(1),
    );
    return this.refreshInFlight$;
  }

  logout(): void {
    this.api.logout().subscribe({ error: () => {} });
    this._accessToken.set(null);
    this.permissionService.clear();
    this._authState.set('unauthenticated');
  }

  restoreSession(): void {
    // No persistent storage — always cold-start unauthenticated.
    this.permissionService.clear();
    this._authState.set('unauthenticated');
  }
}
