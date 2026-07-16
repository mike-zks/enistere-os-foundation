import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AuthApi, AuthTokens } from './auth.api';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let api: jasmine.SpyObj<AuthApi>;

  beforeEach(() => {
    api = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'refresh', 'logout']);
    api.login.and.returnValue(of({ accessToken: 'test-token' }));
    api.refresh.and.returnValue(throwError(() => new Error('no refresh')));
    api.logout.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: api }],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('authState is unauthenticated', () => {
      expect(service.authState()).toBe('unauthenticated');
    });

    it('getAccessToken() returns null', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('isAuthenticated() returns false', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('login()', () => {
    it('sets authState to authenticated on success', () => {
      service.login('user@example.com', 'secret').subscribe();
      expect(service.authState()).toBe('authenticated');
    });

    it('stores a token in memory on success', () => {
      service.login('user@example.com', 'secret').subscribe();
      expect(service.getAccessToken()).toBeTruthy();
    });

    it('authState does not expose the token value', () => {
      service.login('user@example.com', 'secret').subscribe();
      const state: string = service.authState();
      expect(state).toBe('authenticated');
      expect(state).not.toContain('token');
      expect(state).not.toContain('Bearer');
    });

    it('authState is read-only for consumers', () => {
      expect('set' in service.authState).toBeFalse();
      expect('update' in service.authState).toBeFalse();
    });

    it('isAuthenticated() returns true after login', () => {
      service.login('user@example.com', 'secret').subscribe();
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('calls api.login() with credentials', () => {
      service.login('user@example.com', 'secret').subscribe();
      expect(api.login).toHaveBeenCalledOnceWith({ email: 'user@example.com', password: 'secret' });
    });

    it('sets authState to unauthenticated and clears token on error', () => {
      api.login.and.returnValue(throwError(() => new Error('401')));
      let caught = false;
      service.login('user@example.com', 'wrong').subscribe({ error: () => { caught = true; } });
      expect(caught).toBeTrue();
      expect(service.authState()).toBe('unauthenticated');
      expect(service.getAccessToken()).toBeNull();
    });

    it('purges an existing token when a later login attempt fails', () => {
      service.login('user@example.com', 'secret').subscribe();
      expect(service.getAccessToken()).toBe('test-token');

      api.login.and.returnValue(throwError(() => new Error('401')));
      service.login('user@example.com', 'wrong').subscribe({ error: () => {} });

      expect(service.authState()).toBe('unauthenticated');
      expect(service.getAccessToken()).toBeNull();
    });

    it('token is absent from state signal on login error', () => {
      api.login.and.returnValue(throwError(() => new Error('401')));
      service.login('user@example.com', 'wrong').subscribe({ error: () => {} });
      const state: string = service.authState();
      expect(state).not.toContain('token');
      expect(state).not.toContain('Bearer');
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      service.login('user@example.com', 'secret').subscribe();
    });

    it('resets authState to unauthenticated', () => {
      service.logout();
      expect(service.authState()).toBe('unauthenticated');
    });

    it('purges access token from memory', () => {
      service.logout();
      expect(service.getAccessToken()).toBeNull();
    });

    it('isAuthenticated() returns false after logout', () => {
      service.logout();
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('calls api.logout() best-effort', () => {
      service.logout();
      expect(api.logout).toHaveBeenCalled();
    });
  });

  describe('restoreSession()', () => {
    it('sets state to unauthenticated (no persistent storage)', () => {
      service.restoreSession();
      expect(service.authState()).toBe('unauthenticated');
    });

    it('does not restore token after logout', () => {
      service.login('user@example.com', 'secret').subscribe();
      service.logout();
      service.restoreSession();
      expect(service.getAccessToken()).toBeNull();
      expect(service.authState()).toBe('unauthenticated');
    });

    it('token remains inaccessible after restoreSession', () => {
      service.restoreSession();
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('refreshSession()', () => {
    it('calls api.refresh() and emits new token on success', () => {
      api.refresh.and.returnValue(of({ accessToken: 'refreshed-token' }));
      let emittedToken = '';
      service.refreshSession().subscribe((t) => { emittedToken = t; });
      expect(emittedToken).toBe('refreshed-token');
      expect(service.getAccessToken()).toBe('refreshed-token');
      expect(service.authState()).toBe('authenticated');
    });

    it('calls api.refresh() only once for concurrent calls (coalescence)', fakeAsync(() => {
      const subject = new Subject<AuthTokens>();
      api.refresh.and.returnValue(subject.asObservable());

      let token1 = '';
      let token2 = '';
      service.refreshSession().subscribe((t) => { token1 = t; });
      service.refreshSession().subscribe((t) => { token2 = t; });

      expect(api.refresh).toHaveBeenCalledTimes(1);

      subject.next({ accessToken: 'shared-token' });
      subject.complete();
      tick();

      expect(token1).toBe('shared-token');
      expect(token2).toBe('shared-token');
    }));

    it('sets authState to expired and clears token on refresh failure', () => {
      service.login('user@example.com', 'secret').subscribe();
      expect(service.getAccessToken()).toBeTruthy();

      api.refresh.and.returnValue(throwError(() => new Error('refresh-failed')));
      let caught = false;
      service.refreshSession().subscribe({ error: () => { caught = true; } });

      expect(caught).toBeTrue();
      expect(service.authState()).toBe('expired');
      expect(service.getAccessToken()).toBeNull();
    });

    it('allows a new refresh attempt after a failed refresh', () => {
      api.refresh.and.returnValue(throwError(() => new Error('failed')));
      service.refreshSession().subscribe({ error: () => {} });

      api.refresh.and.returnValue(of({ accessToken: 'retry-token' }));
      let token = '';
      service.refreshSession().subscribe((t) => { token = t; });
      expect(token).toBe('retry-token');
    });

    it('token value is absent from authState signal', () => {
      api.refresh.and.returnValue(of({ accessToken: 'refreshed-token' }));
      service.refreshSession().subscribe();
      const state: string = service.authState();
      expect(state).not.toContain('refreshed-token');
      expect(state).not.toContain('Bearer');
    });
  });
});
