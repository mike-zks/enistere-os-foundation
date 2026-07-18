import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { isAppApiError } from '../errors/app-api-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('passes successful responses through unchanged', (done) => {
    http.get('/api/items').subscribe({
      next: (res) => {
        expect(res).toEqual({ id: 1 });
        done();
      },
    });
    controller.expectOne('/api/items').flush({ id: 1 });
  });

  it('converts 404 HttpErrorResponse to AppApiError with code NotFound', (done) => {
    http.get('/api/items').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('NotFound');
          expect(err.statusCode).toBe(404);
        }
        done();
      },
    });
    controller.expectOne('/api/items').flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('converts 401 to Unauthorized without triggering refresh', (done) => {
    http.get('/api/protected').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('Unauthorized');
          expect(err.statusCode).toBe(401);
        }
        done();
      },
    });
    controller.expectOne('/api/protected').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('converts 500 to ServerError', (done) => {
    http.get('/api/data').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('ServerError');
          expect(err.statusCode).toBe(500);
        }
        done();
      },
    });
    controller.expectOne('/api/data').flush(null, { status: 500, statusText: 'Internal Server Error' });
  });

  it('converts status 0 (network error) to NetworkError', (done) => {
    http.get('/api/data').subscribe({
      error: (err: unknown) => {
        expect(isAppApiError(err)).toBeTrue();
        if (isAppApiError(err)) {
          expect(err.code).toBe('NetworkError');
          expect(err.statusCode).toBeNull();
        }
        done();
      },
    });
    controller.expectOne('/api/data').error(new ProgressEvent('error'));
  });

  it('does not expose body or Authorization header in the emitted error', (done) => {
    http.get('/api/data').subscribe({
      error: (err: unknown) => {
        const serialized = JSON.stringify(err);
        expect(serialized).not.toContain('sensitive-body');
        expect(serialized).not.toContain('Authorization');
        expect(serialized).not.toContain('Bearer');
        done();
      },
    });
    controller.expectOne('/api/data').flush(
      { message: 'sensitive-body' },
      { status: 400, statusText: 'Bad Request' },
    );
  });
});
