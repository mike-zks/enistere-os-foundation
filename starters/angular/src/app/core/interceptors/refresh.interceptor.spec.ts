import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from '../auth/auth.api';
import { AuthService } from '../auth/auth.service';
import { isAppApiError } from '../errors/app-api-error';
import { errorInterceptor } from './error.interceptor';
import { refreshInterceptor } from './refresh.interceptor';

// Interceptor array: [refreshInterceptor, errorInterceptor]
// Request:  refresh → error → HTTP
// Response: HTTP → error (maps 401 to AppApiError) → refresh (catches AppApiError{Unauthorized})

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authService: AuthService;
  let mockApi: jasmine.SpyObj<AuthApi>;

  beforeEach(() => {
    mockApi = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'refresh', 'logout']);
    mockApi.login.and.returnValue(of({ accessToken: 'initial-token' }));
    mockApi.refresh.and.returnValue(of({ accessToken: 'refreshed-token' }));
    mockApi.logout.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthApi, useValue: mockApi },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => controller.verify());

  it('passes non-401 responses through unchanged', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    http.get('/api/data').subscribe({
      next: (res) => {
        expect(res).toEqual({ ok: true });
        done();
      },
    });
    controller.expectOne('/api/data').flush({ ok: true });
  });

  it('retries with new token after 401 → refresh success', (done) => {
    authService.login('user@example.com', 'pass').subscribe();

    http.get('/api/protected').subscribe({
      next: (res) => {
        expect(res).toEqual({ data: 'ok' });
        done();
      },
    });

    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = controller.expectOne('/api/protected');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retry.flush({ data: 'ok' });
  });

  it('calls api.refresh() only once per 401', (done) => {
    authService.login('user@example.com', 'pass').subscribe();

    http.get('/api/protected').subscribe({
      next: () => { done(); },
      error: () => { done(); },
    });

    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(mockApi.refresh).toHaveBeenCalledTimes(1);
    controller.expectOne('/api/protected').flush({ data: 'ok' });
  });

  it('calls logout() and re-throws original error when refresh fails', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    mockApi.refresh.and.returnValue(throwError(() => new Error('refresh-failed')));
    const logoutSpy = spyOn(authService, 'logout').and.callThrough();

    http.get('/api/protected').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('Unauthorized');
        }
        expect(logoutSpy).toHaveBeenCalled();
        done();
      },
    });

    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not trigger refresh when no token is present', (done) => {
    http.get('/api/protected').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('Unauthorized');
        }
        expect(mockApi.refresh).not.toHaveBeenCalled();
        done();
      },
    });
    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not trigger refresh on /auth/login 401', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    http.post('/api/v1/auth/login', {}).subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        expect(mockApi.refresh).not.toHaveBeenCalled();
        done();
      },
    });
    controller.expectOne('/api/v1/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not trigger refresh on /auth/refresh 401', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    http.post('/api/v1/auth/refresh', {}).subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        expect(mockApi.refresh).not.toHaveBeenCalled();
        done();
      },
    });
    controller.expectOne('/api/v1/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not trigger refresh on /auth/logout 401', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    http.post('/api/v1/auth/logout', {}).subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        expect(mockApi.refresh).not.toHaveBeenCalled();
        done();
      },
    });
    controller.expectOne('/api/v1/auth/logout').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not retry on non-401 errors', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    http.get('/api/items').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('NotFound');
        }
        expect(mockApi.refresh).not.toHaveBeenCalled();
        done();
      },
    });
    controller.expectOne('/api/items').flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('retry does not force Content-Type for FormData requests', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    const formData = new FormData();
    formData.append('file', new Blob(['content']), 'file.txt');

    http.post('/api/upload', formData).subscribe({
      next: () => done(),
      error: () => { fail('Should succeed after retry'); },
    });

    controller.expectOne('/api/upload').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = controller.expectOne('/api/upload');
    expect(retry.request.headers.has('Content-Type')).toBeFalse();
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retry.flush({ uploaded: true });
  });

  it('retry failure propagates without triggering a second refresh (no infinite loop)', (done) => {
    authService.login('user@example.com', 'pass').subscribe();
    let refreshCount = 0;
    mockApi.refresh.and.callFake(() => {
      refreshCount++;
      return of({ accessToken: 'refreshed-token' });
    });

    http.get('/api/protected').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        expect(refreshCount).toBe(1);
        done();
      },
    });

    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });
  });
});
