import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { sanitizeReturnUrl } from '../../../core/auth/return-url.utils';
import { getFieldError } from '../../../core/forms/form-error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  protected readonly getFieldError = getFieldError;

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
