import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionDirective } from '../../core/permissions/permission.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PermissionDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly authState = this.authService.authState;

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
