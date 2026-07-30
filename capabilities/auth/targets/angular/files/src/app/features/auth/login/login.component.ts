import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { AuthError } from '../auth-errors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Connexion</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label for="email">Adresse e-mail</label>
        <input id="email" type="email" formControlName="email" autocomplete="username" />

        <label for="password">Mot de passe</label>
        <input id="password" type="password" formControlName="password"
               autocomplete="current-password" />

        <button type="submit" [disabled]="pending()">Se connecter</button>
      </form>

      @if (error(); as message) {
        <p role="alert" data-testid="login-error">{{ message }}</p>
      }
    </main>
  `,
})
export class LoginComponent {
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    try {
      await this.#auth.signIn(email, password);
      await this.#router.navigateByUrl(this.#returnTo());
    } catch (failure: unknown) {
      // Only the generic message reaches the template — never the password, the
      // submitted address, or the authority's reason.
      this.error.set(failure instanceof AuthError ? failure.message : 'Connexion impossible.');
    } finally {
      this.pending.set(false);
    }
  }

  /** Internal paths only: an absolute URL here would be an open redirect. */
  #returnTo(): string {
    const raw = this.#route.snapshot.queryParamMap.get('returnTo') ?? '/';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  }
}
