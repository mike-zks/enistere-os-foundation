import { TestBed } from '@angular/core/testing';
import { AuthApi } from '../auth-api';
import { AuthService } from '../auth.service';
import { CREDENTIAL_STORE } from '../credential-store.token';
import { InMemoryCredentialStore } from '../credential-store';
import type { AuthSession } from '../auth-session';

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    user: { id: 'u-1', email: 'user@example.test', status: 'ACTIVE' },
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    tokenType: 'Bearer',
    accessTokenExpiresIn: 900,
    refreshTokenExpiresIn: 2_592_000,
    ...overrides,
  };
}

describe('AuthService', () => {
  let api: jasmine.SpyObj<AuthApi>;
  let store: InMemoryCredentialStore;
  let auth: AuthService;

  beforeEach(() => {
    api = jasmine.createSpyObj<AuthApi>('AuthApi', ['login', 'refresh', 'logout']);
    store = new InMemoryCredentialStore();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApi, useValue: api },
        { provide: CREDENTIAL_STORE, useValue: store },
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  // AUTH-CLIENT-001
  it('signIn établit la session sans exposer de jeton dans l’état observable', async () => {
    api.login.and.resolveTo(session());

    await auth.signIn('user@example.test', 'password');

    expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.snapshot().user?.email).toBe('user@example.test');
    // Le snapshot est ce que voient les templates : aucun jeton ne doit y figurer.
    expect(JSON.stringify(auth.snapshot())).not.toContain('access-1');
    expect(JSON.stringify(auth.snapshot())).not.toContain('refresh-1');
  });

  // AUTH-CLIENT-002
  it('garde le jeton d’accès hors du stockage et le refresh derrière la couture', async () => {
    api.login.and.resolveTo(session());

    await auth.signIn('user@example.test', 'password');

    expect(store.read()).toBe('refresh-1');
    // Le jeton d'accès reste transitoire : il n'est jamais confié au magasin.
    expect(store.read()).not.toBe('access-1');
    expect(auth.accessToken).toBe('access-1');
  });

  // AUTH-CLIENT-003
  it('coalesce plusieurs refresh concurrents en un seul appel', async () => {
    api.login.and.resolveTo(session());
    await auth.signIn('user@example.test', 'password');
    let release!: (value: AuthSession) => void;
    api.refresh.and.returnValue(new Promise<AuthSession>((resolve) => { release = resolve; }));

    const first = auth.refresh();
    const second = auth.refresh();
    const third = auth.refresh();
    release(session({ accessToken: 'access-2', refreshToken: 'refresh-2' }));
    const tokens = await Promise.all([first, second, third]);

    // L'autorité fait tourner le refresh à chaque usage et traite un rejeu comme
    // une réutilisation : trois appels révoqueraient la famille entière.
    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(tokens).toEqual(['access-2', 'access-2', 'access-2']);
    expect(store.read()).toBe('refresh-2');
  });

  // AUTH-CLIENT-003
  it('purge la session locale quand le refresh échoue', async () => {
    api.login.and.resolveTo(session());
    await auth.signIn('user@example.test', 'password');
    api.refresh.and.rejectWith(new Error('expired'));

    const token = await auth.refresh();

    expect(token).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(store.read()).toBeNull();
    expect(auth.accessToken).toBeNull();
  });

  it('refuse de rafraîchir sans refresh token et purge', async () => {
    const token = await auth.refresh();
    expect(token).toBeNull();
    expect(api.refresh).not.toHaveBeenCalled();
  });

  // AUTH-CLIENT-004
  it('signOut demande la révocation distante puis purge', async () => {
    api.login.and.resolveTo(session());
    await auth.signIn('user@example.test', 'password');
    api.logout.and.resolveTo();

    await auth.signOut();

    expect(api.logout).toHaveBeenCalledOnceWith('refresh-1');
    expect(auth.isAuthenticated()).toBeFalse();
    expect(store.read()).toBeNull();
  });

  // AUTH-CLIENT-004
  it('purge même si la révocation distante échoue', async () => {
    api.login.and.resolveTo(session());
    await auth.signIn('user@example.test', 'password');
    api.logout.and.rejectWith(new Error('offline'));

    await auth.signOut();

    // Une autorité injoignable ne doit jamais retenir un utilisateur connecté.
    expect(auth.isAuthenticated()).toBeFalse();
    expect(store.read()).toBeNull();
  });
});
