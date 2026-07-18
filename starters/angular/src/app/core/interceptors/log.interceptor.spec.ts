import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { AppApiError } from '../errors/app-api-error';
import { errorInterceptor } from './error.interceptor';
import { logInterceptor } from './log.interceptor';

describe('logInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let logSpy: jasmine.Spy;
  let errorSpy: jasmine.Spy;

  beforeEach(() => {
    // Interceptor order mirrors app.config.ts: auth → log → error.
    // For these tests: log (outermost of the two) → error (innermost).
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([logInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    logSpy = spyOn(console, 'log');
    errorSpy = spyOn(console, 'error');
  });

  afterEach(() => controller.verify());

  it('logs method, path, and status on success', (done) => {
    http.get('/api/users').subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledOnceWith(jasmine.stringMatching(/^\[HTTP\] GET \/api\/users 200 \+\d+ms$/));
        done();
      },
    });
    controller.expectOne('/api/users').flush([]);
  });

  it('logs correct method for POST', (done) => {
    http.post('/api/users', {}).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledOnceWith(jasmine.stringMatching(/\[HTTP\] POST \/api\/users 201/));
        done();
      },
    });
    controller.expectOne('/api/users').flush({}, { status: 201, statusText: 'Created' });
  });

  it('logs statusCode only on error (no body, no headers)', (done) => {
    http.get('/api/items/99').subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledOnceWith(
          jasmine.stringMatching(/^\[HTTP\] GET \/api\/items\/99 404 \+\d+ms$/),
        );
        done();
      },
    });
    controller.expectOne('/api/items/99').flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('strips query params from the logged URL on success', (done) => {
    http.get('/api/search?q=secret&token=abc123').subscribe({
      next: () => {
        const logged: string = logSpy.calls.mostRecent().args[0] as string;
        expect(logged).toContain('/api/search');
        expect(logged).not.toContain('secret');
        expect(logged).not.toContain('token');
        expect(logged).not.toContain('abc123');
        done();
      },
    });
    controller.expectOne('/api/search?q=secret&token=abc123').flush([]);
  });

  it('strips query params from the logged URL on error', (done) => {
    http.get('/api/search?signed=secret&key=abc').subscribe({
      error: () => {
        const logged: string = errorSpy.calls.mostRecent().args[0] as string;
        expect(logged).toContain('/api/search');
        expect(logged).not.toContain('signed');
        expect(logged).not.toContain('secret');
        expect(logged).not.toContain('key');
        expect(logged).not.toContain('abc');
        done();
      },
    });
    controller.expectOne('/api/search?signed=secret&key=abc').flush(
      null,
      { status: 403, statusText: 'Forbidden' },
    );
  });

  it('never logs Authorization header', (done) => {
    http.get('/api/data', { headers: { Authorization: 'Bearer my-secret-token' } }).subscribe({
      next: () => {
        const logged: string = logSpy.calls.mostRecent().args[0] as string;
        expect(logged).not.toContain('Authorization');
        expect(logged).not.toContain('Bearer');
        expect(logged).not.toContain('my-secret-token');
        done();
      },
    });
    controller.expectOne('/api/data').flush({});
  });

  it('never logs response body', (done) => {
    http.get('/api/profile').subscribe({
      next: () => {
        const logged: string = logSpy.calls.mostRecent().args[0] as string;
        expect(logged).not.toContain('John');
        expect(logged).not.toContain('sensitive-email@example.com');
        done();
      },
    });
    controller.expectOne('/api/profile').flush({
      name: 'John',
      email: 'sensitive-email@example.com',
    });
  });

  it('logs "network" as statusCode for network errors', (done) => {
    http.get('/api/offline').subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledOnceWith(
          jasmine.stringMatching(/\[HTTP\] GET \/api\/offline network \+\d+ms/),
        );
        done();
      },
    });
    controller.expectOne('/api/offline').error(new ProgressEvent('error'));
  });
});
