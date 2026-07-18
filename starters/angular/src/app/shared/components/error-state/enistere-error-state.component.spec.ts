import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EnistereErrorStateComponent } from './enistere-error-state.component';

describe('EnistereErrorStateComponent', () => {
  let fixture: ComponentFixture<EnistereErrorStateComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnistereErrorStateComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnistereErrorStateComponent);
    fixture.componentRef.setInput('title', 'Une erreur est survenue');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should render the error state container', () => {
    expect(compiled.querySelector('.error-state')).toBeTruthy();
  });

  it('should have role="alert" for accessibility', () => {
    const container = compiled.querySelector('.error-state');
    expect(container?.getAttribute('role')).toBe('alert');
  });

  it('should have aria-live="assertive"', () => {
    const container = compiled.querySelector('.error-state');
    expect(container?.getAttribute('aria-live')).toBe('assertive');
  });

  it('should display the required title', () => {
    const title = compiled.querySelector('.state-title');
    expect(title?.textContent?.trim()).toBe('Une erreur est survenue');
  });

  it('should not render description when not provided', () => {
    expect(compiled.querySelector('.state-description')).toBeNull();
  });

  it('should render description when provided', () => {
    fixture.componentRef.setInput('description', 'Veuillez réessayer plus tard.');
    fixture.detectChanges();
    const desc = compiled.querySelector('.state-description');
    expect(desc?.textContent?.trim()).toBe('Veuillez réessayer plus tard.');
  });

  it('should not render retry button when retryLabel is not provided', () => {
    expect(compiled.querySelector('.state-retry')).toBeNull();
  });

  it('should render retry button when retryLabel is provided', () => {
    fixture.componentRef.setInput('retryLabel', 'Réessayer');
    fixture.detectChanges();
    const btn = compiled.querySelector('.state-retry');
    expect(btn?.textContent?.trim()).toBe('Réessayer');
  });

  it('should emit retried when retry button is clicked', () => {
    fixture.componentRef.setInput('retryLabel', 'Réessayer');
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.retried.subscribe(() => (emitted = true));

    const btn = compiled.querySelector<HTMLButtonElement>('.state-retry');
    btn?.click();

    expect(emitted).toBeTrue();
  });
});
