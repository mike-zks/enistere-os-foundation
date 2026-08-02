import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../authorization/authorization.service';
import { FilesComponent } from '../files.component';
import { FilesService } from '../files.service';

describe('FilesComponent', () => {
  it('utilise RBAC seulement pour l’affichage ; les actions restent des appels à l’autorité', async () => {
    const files = {
      state: () => ({ status: 'ready', page: { items: [{
        id: '550e8400-e29b-41d4-a716-446655440000', originalName: 'public.pdf',
        mimeType: 'application/pdf', size: 3, category: 'DOCUMENT', createdAt: 'now',
      }], nextOffset: null, total: 1 }, error: null }),
      load: jasmine.createSpy('load').and.resolveTo(), upload: jasmine.createSpy('upload').and.resolveTo(true),
      download: jasmine.createSpy('download').and.resolveTo(true), delete: jasmine.createSpy('delete').and.resolveTo(true),
      quarantine: jasmine.createSpy('quarantine').and.resolveTo(true), restore: jasmine.createSpy('restore').and.resolveTo(true),
    };
    const authorization = {
      load: jasmine.createSpy('load').and.resolveTo(),
      hasPermission: (permission: string) => permission === 'files.download',
    };
    await TestBed.configureTestingModule({
      imports: [FilesComponent],
      providers: [
        { provide: FilesService, useValue: files },
        { provide: AuthorizationService, useValue: authorization },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FilesComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Télécharger');
    expect(text).not.toContain('Supprimer');
    expect(text).not.toContain('Quarantaine');
    expect(files.load).toHaveBeenCalled();
    expect(authorization.load).toHaveBeenCalled();
  });
});
