import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('Base navigation integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideNoopAnimations()],
    }).compileComponents();
  });

  it('renders HomeComponent at the root', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-home');
  });

  it('redirects an unknown path to the root', async () => {
    await RouterTestingHarness.create('/page-inconnue');
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
