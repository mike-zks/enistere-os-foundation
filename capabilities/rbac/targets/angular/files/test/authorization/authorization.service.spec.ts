import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../auth/auth.service';
import type { AuthSnapshot } from '../../auth/auth-session';
import { AuthorizationApi } from '../authorization-api';
import { AuthorizationService } from '../authorization.service';

const ANONYMOUS: AuthSnapshot = { status: 'unauthenticated', user: null };
const ALICE: AuthSnapshot = {
  status: 'authenticated', user: { id: 'alice', email: 'alice@example.test', status: 'ACTIVE' },
};
const BOB: AuthSnapshot = {
  status: 'authenticated', user: { id: 'bob', email: 'bob@example.test', status: 'ACTIVE' },
};

describe('AuthorizationService', () => {
  let api: jasmine.SpyObj<AuthorizationApi>;
  let session: ReturnType<typeof signal<AuthSnapshot>>;
  let authorization: AuthorizationService;

  beforeEach(() => {
    api = jasmine.createSpyObj<AuthorizationApi>('AuthorizationApi', ['getSummary']);
    session = signal<AuthSnapshot>(ANONYMOUS);
    TestBed.configureTestingModule({
      providers: [
        AuthorizationService,
        { provide: AuthorizationApi, useValue: api },
        { provide: AuthService, useValue: { snapshot: session.asReadonly() } },
      ],
    });
    authorization = TestBed.inject(AuthorizationService);
  });

  // RBAC-CLIENT-002
  it('ne charge rien sans session authentifiée', async () => {
    await authorization.load();
    expect(api.getSummary).not.toHaveBeenCalled();
    expect(authorization.state().status).toBe('idle');
  });

  // RBAC-CLIENT-001
  it('expose le résumé pour l’UX conditionnelle avec des comparaisons exactes', async () => {
    session.set(ALICE);
    api.getSummary.and.resolveTo({
      roles: ['administrator'], permissions: ['files.read', 'files.upload'],
    });

    await authorization.load();

    expect(authorization.hasRole('administrator')).toBeTrue();
    expect(authorization.hasAnyRole(['reader', 'administrator'])).toBeTrue();
    expect(authorization.hasPermission('files.read')).toBeTrue();
    expect(authorization.hasAllPermissions(['files.read', 'files.upload'])).toBeTrue();
    expect(authorization.hasPermission('files.*')).toBeFalse();
    expect(authorization.hasPermission('files.')).toBeFalse();
  });

  // RBAC-CLIENT-002
  it('ne réutilise jamais le résumé d’une autre session', async () => {
    session.set(ALICE);
    api.getSummary.and.resolveTo({ roles: ['administrator'], permissions: ['files.read'] });
    await authorization.load();
    expect(authorization.roles()).toEqual(['administrator']);

    session.set(BOB);
    expect(authorization.state().status).toBe('idle');
    expect(authorization.roles()).toEqual([]);
    expect(authorization.permissions()).toEqual([]);
  });

  // RBAC-CLIENT-003
  it('réduit toute erreur à une forme publique sans secret', async () => {
    session.set(ALICE);
    api.getSummary.and.rejectWith({
      code: 'Forbidden', statusCode: 403, requestId: 'req-42', token: 'ACCESS-SECRET',
    });

    await authorization.load();

    const state = authorization.state();
    expect(state.status).toBe('error');
    expect(JSON.stringify(state)).toBe(JSON.stringify({
      status: 'error', summary: null,
      error: { code: 'Forbidden', requestId: 'req-42' },
    }));
    expect(JSON.stringify(state)).not.toContain('ACCESS-SECRET');
  });
});
