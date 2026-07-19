import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EnistereEmptyStateComponent } from './enistere-empty-state.component';

describe('EnistereEmptyStateComponent', () => {
  let fixture: ComponentFixture<EnistereEmptyStateComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnistereEmptyStateComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EnistereEmptyStateComponent);
    fixture.componentRef.setInput('title', 'Aucun élément');
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should render the empty state container', () => {
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
  });

  it('should have role="status" for accessibility', () => {
    const container = compiled.querySelector('.empty-state');
    expect(container?.getAttribute('role')).toBe('status');
  });

  it('should have aria-live="polite"', () => {
    const container = compiled.querySelector('.empty-state');
    expect(container?.getAttribute('aria-live')).toBe('polite');
  });

  it('should display the required title', () => {
    const title = compiled.querySelector('.state-title');
    expect(title?.textContent?.trim()).toBe('Aucun élément');
  });

  it('should not render description when not provided', () => {
    expect(compiled.querySelector('.state-description')).toBeNull();
  });

  it('should render description when provided', () => {
    fixture.componentRef.setInput('description', `Il n'y a rien à afficher.`);
    fixture.detectChanges();
    const desc = compiled.querySelector('.state-description');
    expect(desc?.textContent?.trim()).toBe(`Il n'y a rien à afficher.`);
  });

  it('should not render action button when actionLabel is not provided', () => {
    expect(compiled.querySelector('.state-action')).toBeNull();
  });

  it('should render action button when actionLabel is provided', () => {
    fixture.componentRef.setInput('actionLabel', 'Créer un élément');
    fixture.detectChanges();
    const btn = compiled.querySelector('.state-action');
    expect(btn?.textContent?.trim()).toBe('Créer un élément');
  });

  it('should emit actionClicked when action button is clicked', () => {
    fixture.componentRef.setInput('actionLabel', 'Créer');
    fixture.detectChanges();

    let emitted = false;
    fixture.componentInstance.actionClicked.subscribe(() => (emitted = true));

    const btn = compiled.querySelector<HTMLButtonElement>('.state-action');
    btn?.click();

    expect(emitted).toBeTrue();
  });
});
