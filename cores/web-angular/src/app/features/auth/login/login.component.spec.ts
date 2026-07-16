import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

function buildActivatedRoute(queryParams: Record<string, string> = {}) {
  return {
    snapshot: {
      queryParamMap: {
        get: (key: string) => queryParams[key] ?? null,
      },
    },
  };
}

describe('LoginComponent', () => {
  function setup(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: buildActivatedRoute(queryParams) },
      ],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    return {
      fixture,
      component: fixture.componentInstance,
      authService: TestBed.inject(AuthService),
      router: TestBed.inject(Router),
    };
  }

  it('should create the component', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should render the login form', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('form')).toBeTruthy();
  });

  it('should use Angular Material form fields', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const fields = el.querySelectorAll('mat-form-field');
    expect(fields.length).toBe(2);
  });

  it('should use password input type for password field', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const passwordInput = el.querySelector('input[type="password"]') as HTMLInputElement;
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.type).toBe('password');
  });

  it('should have an invalid form initially', () => {
    const { component } = setup();
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should not call authService.login when form is invalid', () => {
    const { component, authService } = setup();
    spyOn(authService, 'login');
    component.submit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login with email and password', () => {
    const { component, authService } = setup();
    spyOn(authService, 'login');
    component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    component.submit();
    expect(authService.login).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('should navigate after successful login', fakeAsync(() => {
    const { component, router } = setup();
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    component.submit();
    tick();
    expect(router.navigateByUrl).toHaveBeenCalled();
  }));

  it('should use sanitized returnUrl from query params', fakeAsync(() => {
    const { component, fixture, router } = setup({ returnUrl: '/dashboard/settings' });
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
    component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    component.submit();
    tick();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/settings');
  }));

  it('should reject hostile open-redirect returnUrl', fakeAsync(() => {
    const { component, fixture, router } = setup({ returnUrl: '//evil.com' });
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
    component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    component.submit();
    tick();
    const calledUrl = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0] as string;
    expect(calledUrl).not.toContain('evil.com');
    expect(calledUrl).toBe('/dashboard');
  }));

  it('should show email required error when touched and empty', () => {
    const { fixture, component } = setup();
    component.loginForm.controls.email.markAsTouched();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const matError = el.querySelector('mat-error');
    expect(matError).toBeTruthy();
    expect(matError?.textContent?.trim()).toContain('obligatoire');
  });

  it('should show email invalid error when email format is wrong', () => {
    const { fixture, component } = setup();
    component.loginForm.controls.email.setValue('not-an-email');
    component.loginForm.controls.email.markAsTouched();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const matError = el.querySelector('mat-error');
    expect(matError).toBeTruthy();
    expect(matError?.textContent?.trim()).toContain("n'est pas valide");
  });

  it('should show password required error when password is touched and empty', () => {
    const { fixture, component } = setup();
    component.loginForm.controls.email.setValue('user@example.com');
    component.loginForm.controls.password.markAsTouched();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const matErrors = el.querySelectorAll('mat-error');
    const passwordError = Array.from(matErrors).find(e => e.textContent?.includes('Mot de passe'));
    expect(passwordError).toBeTruthy();
  });

  it('should not expose password value in the DOM', () => {
    const { fixture, component } = setup();
    component.loginForm.setValue({ email: 'user@example.com', password: 'SuperSecret123' });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('SuperSecret123');
    const passwordInput = el.querySelector('input[type="password"]') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('should disable submit button when form is invalid', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('should enable submit button when form is valid', () => {
    const { fixture, component } = setup();
    component.loginForm.setValue({ email: 'user@example.com', password: 'password123' });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });
});
