import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AuthSnapshot } from '../../auth/auth-session';
import { AuthService } from '../../auth/auth.service';
import { FilesApi } from '../files-api';
import { FilesService } from '../files.service';

const ANONYMOUS: AuthSnapshot = { status: 'unauthenticated', user: null };
const ALICE: AuthSnapshot = { status: 'authenticated', user: { id: 'alice', email: 'a@test', status: 'ACTIVE' } };
const BOB: AuthSnapshot = { status: 'authenticated', user: { id: 'bob', email: 'b@test', status: 'ACTIVE' } };
const ID = '550e8400-e29b-41d4-a716-446655440000';
const PAGE = { items: [], nextOffset: null, total: 0 };

describe('FilesService', () => {
  let api: jasmine.SpyObj<FilesApi>;
  let session: ReturnType<typeof signal<AuthSnapshot>>;
  let files: FilesService;

  beforeEach(() => {
    api = jasmine.createSpyObj<FilesApi>('FilesApi', ['list', 'upload', 'issueDownloadUrl', 'delete', 'quarantine', 'restore']);
    session = signal<AuthSnapshot>(ANONYMOUS);
    TestBed.configureTestingModule({ providers: [
      FilesService, { provide: FilesApi, useValue: api },
      { provide: AuthService, useValue: { snapshot: session.asReadonly() } },
    ] });
    files = TestBed.inject(FilesService);
  });

  // FILES-CLIENT-003
  it('ne charge rien sans session et ne réutilise jamais une page entre deux sessions', async () => {
    await files.load();
    expect(api.list).not.toHaveBeenCalled();

    session.set(ALICE);
    api.list.and.resolveTo(PAGE);
    await files.load(20, 10);
    expect(api.list).toHaveBeenCalledWith(10, 20);
    expect(files.state().status).toBe('ready');

    session.set(BOB);
    expect(files.state().status).toBe('idle');
    expect(files.state().page).toBeNull();
  });

  // FILES-CLIENT-001, FILES-CLIENT-003
  it('réduit les erreurs à un état public distinct sans corps, nom local ni secret', async () => {
    session.set(ALICE);
    api.list.and.rejectWith({ code: 'Forbidden', statusCode: 403, requestId: 'req-42', body: 'SECRET' });
    await files.load();
    expect(JSON.stringify(files.state())).toBe(JSON.stringify({
      status: 'error', page: null, error: { kind: 'forbidden', requestId: 'req-42' },
    }));
    expect(JSON.stringify(files.state())).not.toContain('SECRET');
  });

  // FILES-CLIENT-005, FILES-CLIENT-006
  it('refuse les mutations sans session ou identifiant validé avant tout appel réseau', async () => {
    expect(await files.delete(ID)).toBeFalse();
    session.set(ALICE);
    expect(await files.delete('../object')).toBeFalse();
    expect(await files.quarantine('bad')).toBeFalse();
    expect(await files.restore('bad')).toBeFalse();
    expect(api.delete).not.toHaveBeenCalled();
    expect(api.quarantine).not.toHaveBeenCalled();
    expect(api.restore).not.toHaveBeenCalled();
  });
});
