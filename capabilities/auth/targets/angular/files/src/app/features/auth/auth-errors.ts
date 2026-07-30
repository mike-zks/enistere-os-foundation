/**
 * Failures the UI may render.
 *
 * The message is deliberately generic and identical for every credential
 * failure: telling a caller that an address exists but the password is wrong
 * turns the login form into an account enumerator.
 */
export class AuthError extends Error {
  readonly requestId: string | null;

  constructor(message: string, requestId: string | null = null) {
    super(message);
    this.name = 'AuthError';
    this.requestId = requestId;
  }
}

export const GENERIC_CREDENTIALS_MESSAGE = 'Identifiants invalides.';
export const GENERIC_UNAVAILABLE_MESSAGE = 'Service indisponible, réessayez.';
