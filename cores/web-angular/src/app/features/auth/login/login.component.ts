import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { sanitizeReturnUrl } from '../../../core/auth/return-url.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isLoading = false;
  errorMessage: string | null = null;
  private returnUrl = '/dashboard';

  ngOnInit(): void {
    const param = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl = sanitizeReturnUrl(param);
  }

  submit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.getRawValue();

    try {
      this.authService.login(email, password);
      void this.router.navigateByUrl(this.returnUrl);
    } catch {
      this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
    } finally {
      this.isLoading = false;
    }
  }
}
