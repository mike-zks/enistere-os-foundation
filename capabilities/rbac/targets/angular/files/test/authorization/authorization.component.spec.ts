import { TestBed } from '@angular/core/testing';
import { AuthorizationComponent } from '../authorization.component';
import { AuthorizationService } from '../authorization.service';

describe('AuthorizationComponent', () => {
  it('affiche uniquement les comptes du résumé d’autorisation', async () => {
    const service = {
      state: () => ({ status: 'ready' }),
      roles: () => ['administrator'],
      permissions: () => ['files.read', 'files.upload'],
      load: jasmine.createSpy('load').and.resolveTo(),
    };
    await TestBed.configureTestingModule({
      imports: [AuthorizationComponent],
      providers: [{ provide: AuthorizationService, useValue: service }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthorizationComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('1 rôle(s)');
    expect(text).toContain('2 permission(s)');
    expect(text).not.toContain('administrator');
    expect(text).not.toContain('files.read');
    expect(service.load).toHaveBeenCalledTimes(1);
  });
});
