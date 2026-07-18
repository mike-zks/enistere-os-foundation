import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokens {
  readonly accessToken: string;
}

export abstract class AuthApi {
  abstract login(credentials: LoginCredentials): Observable<AuthTokens>;
  abstract refresh(): Observable<AuthTokens>;
  abstract logout(): Observable<void>;
}

@Injectable()
export class PlaceholderAuthApi extends AuthApi {
  override login(_credentials: LoginCredentials): Observable<AuthTokens> {
    return of({ accessToken: 'placeholder-memory-token' });
  }

  override refresh(): Observable<AuthTokens> {
    return throwError(() => new Error('No session to refresh in placeholder mode'));
  }

  override logout(): Observable<void> {
    return of(undefined);
  }
}
