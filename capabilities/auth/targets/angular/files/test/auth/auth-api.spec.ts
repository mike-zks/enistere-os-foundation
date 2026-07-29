import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_URL } from '../../config/api-config';
import { AuthApi } from '../auth-api';
import { AuthError } from '../auth-errors';

/** Awaits a rejection and returns it typed, instead of an AuthSession union. */
async function rejection(promise: Promise<unknown>): Promise<AuthError> {
  try {
    await promise;
  } catch (error: unknown) {
    return error as AuthError;
  }
  throw new Error('expected the call to reject');
}

describe('AuthApi', () => {
  let api: AuthApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_URL, useValue: '' },
        AuthApi,
      ],
    });
    api = TestBed.inject(AuthApi);
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(HttpClient);
  });

  afterEach(() => backend.verify());

  // AUTH-CLIENT-005
  it('mot de passe faux et compte inconnu donnent le MÊME message générique', async () => {
    const wrong = rejection(api.login('user@example.test', 'bad'));
    backend.expectOne('/api/v1/auth/login')
      .flush({ errorCode: 'AUTH_INVALID_CREDENTIALS', requestId: 'r-1' },
        { status: 401, statusText: 'Unauthorized' });

    const unknownAccount = rejection(api.login('nobody@example.test', 'bad'));
    backend.expectOne('/api/v1/auth/login')
      .flush({ errorCode: 'AUTH_INVALID_CREDENTIALS', requestId: 'r-2' },
        { status: 401, statusText: 'Unauthorized' });

    // Un message différent transformerait le formulaire en énumérateur de comptes.
    expect((await wrong).message).toBe((await unknownAccount).message);
    expect((await wrong).message).toBe('Identifiants invalides.');
  });

  // AUTH-CLIENT-005
  it('conserve le requestId et ne divulgue jamais le secret soumis', async () => {
    const failure = rejection(api.login('user@example.test', 'super-secret-pw'));
    backend.expectOne('/api/v1/auth/login')
      .flush({ errorCode: 'AUTH_INVALID_CREDENTIALS', requestId: 'req-42' },
        { status: 401, statusText: 'Unauthorized' });

    const error = await failure;
    expect(error.requestId).toBe('req-42');
    expect(JSON.stringify(error)).not.toContain('super-secret-pw');
    expect(error.message).not.toContain('super-secret-pw');
  });

  // AUTH-CLIENT-004
  it('logout absorbe une autorité injoignable', async () => {
    const done = api.logout('refresh-1');
    backend.expectOne('/api/v1/auth/logout')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await expectAsync(done).toBeResolved();
  });

  // AUTH-WEB-001 : aucune créance ambiante n'est jointe à la requête.
  it('n’envoie aucun cookie : le SPA ne détient pas de créance ambiante', () => {
    void api.login('user@example.test', 'password');
    const request = backend.expectOne('/api/v1/auth/login');
    expect(request.request.withCredentials).toBeFalse();
    request.flush({});
  });
});
