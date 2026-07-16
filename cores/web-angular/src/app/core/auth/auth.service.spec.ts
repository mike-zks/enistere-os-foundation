import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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
    it('sets authState to authenticated', () => {
      service.login('user@example.com', 'secret');
      expect(service.authState()).toBe('authenticated');
    });

    it('stores a token in memory', () => {
      service.login('user@example.com', 'secret');
      expect(service.getAccessToken()).toBeTruthy();
    });

    it('authState does not expose the token value', () => {
      service.login('user@example.com', 'secret');
      // The state signal holds only the AuthState literal, never the token string
      const state: string = service.authState();
      expect(state).toBe('authenticated');
      expect(state).not.toContain('token');
      expect(state).not.toContain('Bearer');
    });

    it('isAuthenticated() returns true', () => {
      service.login('user@example.com', 'secret');
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      service.login('user@example.com', 'secret');
    });

    it('resets authState to unauthenticated', () => {
      service.logout();
      expect(service.authState()).toBe('unauthenticated');
    });

    it('purges access token from memory', () => {
      service.logout();
      expect(service.getAccessToken()).toBeNull();
    });

    it('isAuthenticated() returns false', () => {
      service.logout();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('restoreSession()', () => {
    it('sets state to unauthenticated (no persistent storage)', () => {
      service.restoreSession();
      expect(service.authState()).toBe('unauthenticated');
    });

    it('does not restore token after logout', () => {
      service.login('user@example.com', 'secret');
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
});
