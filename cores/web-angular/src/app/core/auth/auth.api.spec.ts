import { TestBed } from '@angular/core/testing';
import { PlaceholderAuthApi } from './auth.api';

describe('PlaceholderAuthApi', () => {
  let api: PlaceholderAuthApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlaceholderAuthApi] });
    api = TestBed.inject(PlaceholderAuthApi);
  });

  it('login() emits a placeholder access token', (done) => {
    api.login({ email: 'user@example.com', password: 'secret' }).subscribe({
      next: (tokens) => {
        expect(tokens.accessToken).toBeTruthy();
        expect(tokens.accessToken).not.toContain('Bearer');
        done();
      },
    });
  });

  it('refresh() emits an error (no session in placeholder mode)', (done) => {
    api.refresh().subscribe({
      error: (err: unknown) => {
        expect(err).toBeTruthy();
        done();
      },
    });
  });

  it('logout() completes without error', (done) => {
    api.logout().subscribe({
      complete: () => {
        expect(true).toBeTrue();
        done();
      },
      error: () => { fail('logout() should not error'); },
    });
  });
});
