import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AUTH_ENDPOINT } from '../auth-api';
import { authInterceptor } from '../auth.interceptor';
import { AuthService } from '../auth.service';
import { HttpContext } from '@angular/common/http';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService> & { accessToken: string | null };

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['refresh']) as never;
    (auth as { accessToken: string | null }).accessToken = 'access-1';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  // AUTH-CLIENT-003
  it('attache le jeton porteur aux appels applicatifs', () => {
    http.get('/api/v1/files').subscribe({ error: () => undefined });
    const request = backend.expectOne('/api/v1/files');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-1');
    request.flush({});
  });

  // AUTH-CLIENT-003
  it('401 → un seul refresh puis un seul rejeu', async () => {
    auth.refresh.and.resolveTo('access-2');
    const result = firstValue(http.get('/api/v1/files'));

    backend.expectOne('/api/v1/files').flush(null, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    const retry = backend.expectOne('/api/v1/files');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush({ ok: true });

    expect(await result).toEqual({ ok: true });
    expect(auth.refresh).toHaveBeenCalledTimes(1);
  });

  // AUTH-CLIENT-003
  it('refresh impossible → l’erreur 401 remonte, aucun rejeu', async () => {
    auth.refresh.and.resolveTo(null);
    const result = firstValue(http.get('/api/v1/files')).catch((error: unknown) => error);

    backend.expectOne('/api/v1/files').flush(null, { status: 401, statusText: 'Unauthorized' });

    const error = await result;
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(401);
  });

  it('ne rejoue jamais un autre code que 401', async () => {
    const result = firstValue(http.get('/api/v1/files')).catch((error: unknown) => error);
    backend.expectOne('/api/v1/files').flush(null, { status: 403, statusText: 'Forbidden' });
    await result;
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  // Boucle infinie : un refresh en échec ne doit pas repasser par l'intercepteur.
  it('laisse les appels d’authentification intacts', () => {
    const context = new HttpContext().set(AUTH_ENDPOINT, true);
    // Error handler present: an unhandled rejection here would surface as a
    // suite-level failure in afterAll rather than as this test's assertion.
    http.post('/api/v1/auth/refresh', {}, { context }).subscribe({ error: () => undefined });
    const request = backend.expectOne('/api/v1/auth/refresh');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});

function firstValue<T>(observable: { subscribe: (o: Record<string, unknown>) => void }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    observable.subscribe({ next: resolve, error: reject });
  });
}
