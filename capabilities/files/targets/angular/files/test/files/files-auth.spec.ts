import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_URL } from '../../../core/config/api-config';
import { AuthService } from '../../auth/auth.service';
import { authInterceptor } from '../../auth/auth.interceptor';
import { FilesApi } from '../files-api';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Files authenticated transport', () => {
  let api: FilesApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      FilesApi,
      { provide: APP_BASE_URL, useValue: '' },
      { provide: AuthService, useValue: { accessToken: 'memory-only-access-token' } },
    ] });
    api = TestBed.inject(FilesApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  // FILES-CLIENT-002, FILES-CLIENT-005, FILES-CLIENT-006
  it('porte le Bearer mémoire sur chaque mutation sans cookie ni créance ambiante', async () => {
    const operations = [
      { promise: api.delete(ID), method: 'DELETE', path: `/api/v1/files/${ID}`, status: 204 },
      { promise: api.quarantine(ID), method: 'POST', path: `/api/v1/files/${ID}/quarantine`, status: 200 },
      { promise: api.restore(ID), method: 'POST', path: `/api/v1/files/${ID}/restore`, status: 200 },
    ];

    for (const operation of operations) {
      const request = backend.expectOne(operation.path);
      expect(request.request.method).toBe(operation.method);
      expect(request.request.headers.get('Authorization')).toBe('Bearer memory-only-access-token');
      expect(request.request.withCredentials).toBeFalse();
      request.flush(null, { status: operation.status, statusText: 'ok' });
      await operation.promise;
    }
  });
});
