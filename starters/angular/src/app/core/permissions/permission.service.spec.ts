import { TestBed } from '@angular/core/testing';
import { PermissionService, normalizePermission, normalizeRole } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionService);
  });

  it('starts with no roles or permissions', () => {
    expect(service.authorization()).toEqual({ roles: [], permissions: [] });
  });

  it('normalizes roles and permissions', () => {
    service.setAuthorization({
      roles: [' Administrator ', 'administrator', 'USER'],
      permissions: [' Files.Upload ', 'files.read'],
    });

    expect(service.authorization()).toEqual({
      roles: ['administrator', 'user'],
      permissions: ['files.read', 'files.upload'],
    });
  });

  it('rejects empty values, wildcards and invalid characters', () => {
    service.setAuthorization({
      roles: ['', 'admin*', 'valid_role', 'bad role'],
      permissions: ['*', 'files.*', 'files.upload', 'bad permission'],
    });

    expect(service.authorization()).toEqual({
      roles: ['valid_role'],
      permissions: ['files.upload'],
    });
  });

  it('checks a single role', () => {
    service.setAuthorization({ roles: ['admin'] });

    expect(service.hasRole('ADMIN')).toBeTrue();
    expect(service.hasRole('user')).toBeFalse();
  });

  it('checks any role', () => {
    service.setAuthorization({ roles: ['operator'] });

    expect(service.hasAnyRole(['admin', 'operator'])).toBeTrue();
    expect(service.hasAnyRole(['admin', 'user'])).toBeFalse();
  });

  it('checks a single permission', () => {
    service.setAuthorization({ permissions: ['files.upload'] });

    expect(service.hasPermission('FILES.UPLOAD')).toBeTrue();
    expect(service.hasPermission('files.delete')).toBeFalse();
  });

  it('checks all permissions', () => {
    service.setAuthorization({ permissions: ['files.upload', 'files.read'] });

    expect(service.hasAllPermissions(['files.upload', 'files.read'])).toBeTrue();
    expect(service.hasAllPermissions(['files.upload', 'files.delete'])).toBeFalse();
    expect(service.hasAllPermissions([])).toBeFalse();
  });

  it('checks any permission', () => {
    service.setAuthorization({ permissions: ['files.read'] });

    expect(service.hasAnyPermission(['files.upload', 'files.read'])).toBeTrue();
    expect(service.hasAnyPermission(['files.upload', 'files.delete'])).toBeFalse();
  });

  it('clears authorization', () => {
    service.setAuthorization({ roles: ['admin'], permissions: ['files.upload'] });

    service.clear();

    expect(service.authorization()).toEqual({ roles: [], permissions: [] });
  });

  it('normalizes standalone values defensively', () => {
    expect(normalizeRole(' Admin ')).toBe('admin');
    expect(normalizeRole('bad role')).toBeNull();
    expect(normalizePermission(' Files.Upload ')).toBe('files.upload');
    expect(normalizePermission('files.*')).toBeNull();
  });
});
