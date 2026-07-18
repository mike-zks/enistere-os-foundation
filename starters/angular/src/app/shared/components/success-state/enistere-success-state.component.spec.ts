import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EnistereSuccessStateComponent } from './enistere-success-state.component';

describe('EnistereSuccessStateComponent', () => {
  let fixture: ComponentFixture<EnistereSuccessStateComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnistereSuccessStateComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnistereSuccessStateComponent);
    fixture.componentRef.setInput('title', 'Opération réussie');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should render the success state container', () => {
    expect(compiled.querySelector('.success-state')).toBeTruthy();
  });

  it('should have role="status" for accessibility', () => {
    const container = compiled.querySelector('.success-state');
    expect(container?.getAttribute('role')).toBe('status');
  });

  it('should have aria-live="polite"', () => {
    const container = compiled.querySelector('.success-state');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });

  it('should display the required title', () => {
    const title = compiled.querySelector('.state-title');
    expect(title?.textContent?.trim()).toBe('Opération réussie');
  });

  it('should not render description when not provided', () => {
    expect(compiled.querySelector('.state-description')).toBeNull();
  });

  it('should render description when provided', () => {
    fixture.componentRef.setInput('description', 'Vos données ont été enregistrées.');
    fixture.detectChanges();
    const desc = compiled.querySelector('.state-description');
    expect(desc?.textContent?.trim()).toBe('Vos données ont été enregistrées.');
  });

  it('should not render action button when actionLabel is not provided', () => {
    expect(compiled.querySelector('.state-action')).toBeNull();
  });

  it('should render action button when actionLabel is provided', () => {
    fixture.componentRef.setInput('actionLabel', 'Continuer');
    fixture.detectChanges();
    const btn = compiled.querySelector('.state-action');
    expect(btn?.textContent?.trim()).toBe('Continuer');
  });

  it('should emit actionClicked when action button is clicked', () => {
    fixture.componentRef.setInput('actionLabel', 'Continuer');
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.actionClicked.subscribe(() => (emitted = true));

    const btn = compiled.querySelector<HTMLButtonElement>('.state-action');
    btn?.click();

    expect(emitted).toBeTrue();
  });
});
