import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EnistereLoadingStateComponent } from './enistere-loading-state.component';

describe('EnistereLoadingStateComponent', () => {
  let fixture: ComponentFixture<EnistereLoadingStateComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnistereLoadingStateComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnistereLoadingStateComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should render the loading state container', () => {
    expect(compiled.querySelector('.loading-state')).toBeTruthy();
  });

  it('should have role="status" for accessibility', () => {
    const container = compiled.querySelector('.loading-state');
    expect(container?.getAttribute('role')).toBe('status');
  });

  it('should have aria-live="polite"', () => {
    const container = compiled.querySelector('.loading-state');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });

  it('should display the default message', () => {
    const msg = compiled.querySelector('.loading-message');
    expect(msg?.textContent?.trim()).toBe('Chargement en cours…');
  });

  it('should display a custom message when provided', () => {
    fixture.componentRef.setInput('message', 'Veuillez patienter…');
    fixture.detectChanges();
    const msg = compiled.querySelector('.loading-message');
    expect(msg?.textContent?.trim()).toBe('Veuillez patienter…');
  });

  it('should set aria-label from message input', () => {
    fixture.componentRef.setInput('message', 'Chargement des données');
    fixture.detectChanges();
    const container = compiled.querySelector('.loading-state');
    expect(container?.getAttribute('aria-label')).toBe('Chargement des données');
  });

  it('should render a mat-spinner', () => {
    expect(compiled.querySelector('mat-spinner, mat-progress-spinner')).toBeTruthy();
  });
});
