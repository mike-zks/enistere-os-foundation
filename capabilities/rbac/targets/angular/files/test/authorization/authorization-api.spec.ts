import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_URL } from '../../../core/config/api-config';
import { AuthorizationApi } from '../authorization-api';

describe('AuthorizationApi', () => {
  let api: AuthorizationApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_URL, useValue: 'https://api.example.test' },
        AuthorizationApi,
      ],
    });
    api = TestBed.inject(AuthorizationApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  // RBAC-CLIENT-003
  it('ne demande que le résumé public de l’autorité', async () => {
    const result = api.getSummary();
    const request = backend.expectOne('https://api.example.test/api/v1/auth/me/authorization');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBeFalse();
    request.flush({
      success: true,
      data: { roles: ['operator'], permissions: ['files.read'] },
      timestamp: '2026-08-01T00:00:00.000Z',
    });

    await expectAsync(result).toBeResolvedTo({
      roles: ['operator'], permissions: ['files.read'],
    });
  });

  it('accepte le résumé public brut renvoyé par Spring et FastAPI', async () => {
    const result = api.getSummary();
    backend.expectOne('https://api.example.test/api/v1/auth/me/authorization').flush({
      roles: ['operator'], permissions: ['files.read'],
    });
    await expectAsync(result).toBeResolvedTo({ roles: ['operator'], permissions: ['files.read'] });
  });
});
