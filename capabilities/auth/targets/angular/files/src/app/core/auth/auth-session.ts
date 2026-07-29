/** Public identity carried with a session. Never holds secret material. */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly status: string;
}

/** What the authority returns on login and on refresh (ADR-068 canonical shape). */
export interface AuthSession {
  readonly user: AuthUser;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  readonly accessTokenExpiresIn: number;
  readonly refreshTokenExpiresIn: number;
}

/** What the UI is allowed to observe. Deliberately token-free. */
export interface AuthSnapshot {
  readonly status: 'unauthenticated' | 'authenticated';
  readonly user: AuthUser | null;
}

export const ANONYMOUS: AuthSnapshot = Object.freeze({ status: 'unauthenticated', user: null });
