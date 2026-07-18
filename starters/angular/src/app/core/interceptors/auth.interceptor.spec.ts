import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { AuthApi, PlaceholderAuthApi } from '../auth/auth.api';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';

describe('authInterceptor', () => {
  let httpController: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthApi, useClass: PlaceholderAuthApi },
      ],
    });
    httpController = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('does not inject Authorization header when no token present', () => {
    httpClient.get('/api/v1/data').subscribe();
    const req = httpController.expectOne('/api/v1/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('injects Authorization Bearer header when token present', () => {
    authService.login('user@example.com', 'pass').subscribe();
    httpClient.get('/api/v1/data').subscribe();
    const req = httpController.expectOne('/api/v1/data');
    expect(req.request.headers.get('Authorization')).toMatch(/^Bearer .+/);
    req.flush({});
  });

  it('does not inject header on /auth/login endpoint', () => {
    authService.login('user@example.com', 'pass').subscribe();
    httpClient.post('/api/v1/auth/login', {}).subscribe();
    const req = httpController.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('does not inject header on /auth/refresh endpoint', () => {
    authService.login('user@example.com', 'pass').subscribe();
    httpClient.post('/api/v1/auth/refresh', {}).subscribe();
    const req = httpController.expectOne('/api/v1/auth/refresh');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('does not inject header on /auth/logout endpoint', () => {
    authService.login('user@example.com', 'pass').subscribe();
    httpClient.post('/api/v1/auth/logout', {}).subscribe();
    const req = httpController.expectOne('/api/v1/auth/logout');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('removes Authorization header after logout', () => {
    authService.login('user@example.com', 'pass').subscribe();
    authService.logout();
    httpClient.get('/api/v1/data').subscribe();
    const req = httpController.expectOne('/api/v1/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
