import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionDirective, type PermissionRequirement } from './permission.directive';
import { PermissionService } from './permission.service';

@Component({
  standalone: true,
  imports: [PermissionDirective],
  template: `
    <p *enisterePermission="'files.upload'" class="single">Upload</p>
    <p *enisterePermission="['files.read', 'files.upload']" class="all">All</p>
    <p *enisterePermission="['files.read', 'files.delete']; mode: 'any'" class="any">Any</p>
    <p *enisterePermission="roleRequirement" class="role">Role</p>
    <p *enisterePermission="mixedRequirement" class="mixed">Mixed</p>
  `,
})
class HostComponent {
  roleRequirement: PermissionRequirement = { role: 'admin' };
  mixedRequirement: PermissionRequirement = {
    role: 'admin',
    permission: 'files.upload',
  };
}

describe('PermissionDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let permissionService: PermissionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    permissionService = TestBed.inject(PermissionService);
    fixture.detectChanges();
  });

  it('hides content by default', () => {
    expect(fixture.nativeElement.querySelector('.single')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role')).toBeNull();
  });

  it('shows content when a single permission is granted', () => {
    permissionService.setAuthorization({ permissions: ['files.upload'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.single')?.textContent.trim()).toBe('Upload');
  });

  it('requires all permissions by default for arrays', () => {
    permissionService.setAuthorization({ permissions: ['files.read'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.all')).toBeNull();

    permissionService.setAuthorization({ permissions: ['files.read', 'files.upload'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.all')?.textContent.trim()).toBe('All');
  });

  it('supports any mode for permission arrays', () => {
    permissionService.setAuthorization({ permissions: ['files.read'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.any')?.textContent.trim()).toBe('Any');
  });

  it('supports role requirements', () => {
    permissionService.setAuthorization({ roles: ['admin'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.role')?.textContent.trim()).toBe('Role');
  });

  it('requires every role and permission in object mode all', () => {
    permissionService.setAuthorization({ roles: ['admin'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mixed')).toBeNull();

    permissionService.setAuthorization({ roles: ['admin'], permissions: ['files.upload'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mixed')?.textContent.trim()).toBe('Mixed');
  });

  it('removes content when authorization is cleared', () => {
    permissionService.setAuthorization({ permissions: ['files.upload'] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.single')).toBeTruthy();

    permissionService.clear();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.single')).toBeNull();
  });
});
