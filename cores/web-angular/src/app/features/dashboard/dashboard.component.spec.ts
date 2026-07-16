import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/auth/auth.service';
import { AuthApi, PlaceholderAuthApi } from '../../core/auth/auth.api';
import { PermissionService } from '../../core/permissions/permission.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let authService: AuthService;
  let permissionService: PermissionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthApi, useClass: PlaceholderAuthApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    permissionService = TestBed.inject(PermissionService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the dashboard shell', () => {
    expect(document.querySelector('main.dashboard-shell')).toBeTruthy();
  });

  it('should display a heading', () => {
    const h1 = document.querySelector('h1.dashboard-title');
    expect(h1?.textContent?.trim()).toBe('Dashboard');
  });

  it('should display a logout button', () => {
    const btn = document.querySelector('button.logout-btn');
    expect(btn).toBeTruthy();
  });

  it('should expose authState signal', () => {
    authService.login('user@example.com', 'pass').subscribe();
    expect(component.authState()).toBe('authenticated');
  });

  it('hides permission-gated content without permission', () => {
    expect(document.querySelector('.dashboard-permission')).toBeNull();
  });

  it('shows permission-gated content when permission is granted', () => {
    permissionService.setAuthorization({ permissions: ['files.upload'] });
    fixture.detectChanges();

    expect(document.querySelector('.dashboard-permission')?.textContent?.trim()).toBe('Upload autorisé');
  });

  describe('logout()', () => {
    it('calls authService.logout()', fakeAsync(() => {
      authService.login('user@example.com', 'pass');
      spyOn(authService, 'logout').and.callThrough();
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      component.logout();
      tick();

      expect(authService.logout).toHaveBeenCalledTimes(1);
    }));

    it('navigates to /login after logout', fakeAsync(() => {
      authService.login('user@example.com', 'pass');
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      component.logout();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('resets auth state to unauthenticated', fakeAsync(() => {
      authService.login('user@example.com', 'pass');
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

      component.logout();
      tick();

      expect(authService.authState()).toBe('unauthenticated');
    }));
  });
});
