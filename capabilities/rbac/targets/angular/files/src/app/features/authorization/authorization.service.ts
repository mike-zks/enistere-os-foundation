import { Injectable, computed, inject, signal } from '@angular/core';
import { isAppApiError } from '../../core/errors/app-api-error';
import { AuthService } from '../auth/auth.service';
import { AuthorizationApi } from './authorization-api';
import type { AuthorizationSummary, PublicAuthorizationError } from './authorization-summary';

type AuthorizationState =
  | { readonly status: 'idle'; readonly summary: null; readonly error: null }
  | { readonly status: 'loading'; readonly summary: null; readonly error: null }
  | { readonly status: 'ready'; readonly summary: AuthorizationSummary; readonly error: null }
  | { readonly status: 'error'; readonly summary: null; readonly error: PublicAuthorizationError };

interface StoredAuthorizationState {
  readonly ownerId: string | null;
  readonly value: AuthorizationState;
}

const IDLE: AuthorizationState = Object.freeze({
  status: 'idle', summary: null, error: null,
});

const normalize = (code: string): string => code.trim();

/**
 * État RBAC propre à la session courante.
 *
 * Les rôles et permissions ne servent qu’à l’affichage conditionnel. Ils ne
 * prouvent jamais qu’une opération est autorisée : chaque requête reste décidée
 * par l’API. L’ownerId privé empêche aussi de réutiliser le résumé après un
 * changement de session, même si une ancienne requête se termine plus tard.
 */
@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  readonly #api = inject(AuthorizationApi);
  readonly #auth = inject(AuthService);
  readonly #stored = signal<StoredAuthorizationState>({ ownerId: null, value: IDLE });

  readonly state = computed<AuthorizationState>(() => {
    const currentOwner = this.#auth.snapshot().user?.id ?? null;
    const stored = this.#stored();
    return stored.ownerId === currentOwner ? stored.value : IDLE;
  });
  readonly roles = computed(() => this.state().summary?.roles ?? []);
  readonly permissions = computed(() => this.state().summary?.permissions ?? []);

  async load(): Promise<void> {
    const ownerId = this.#auth.snapshot().user?.id ?? null;
    if (!ownerId) {
      this.#stored.set({ ownerId: null, value: IDLE });
      return;
    }

    this.#stored.set({ ownerId, value: { status: 'loading', summary: null, error: null } });
    try {
      const summary = await this.#api.getSummary();
      if (this.#auth.snapshot().user?.id === ownerId) {
        this.#stored.set({ ownerId, value: { status: 'ready', summary, error: null } });
      }
    } catch (error: unknown) {
      if (this.#auth.snapshot().user?.id === ownerId) {
        this.#stored.set({
          ownerId,
          value: { status: 'error', summary: null, error: publicError(error) },
        });
      }
    }
  }

  hasRole(code: string): boolean {
    const candidate = normalize(code);
    return candidate.length > 0 && this.roles().includes(candidate);
  }

  hasAnyRole(codes: readonly string[]): boolean {
    return codes.some((code) => this.hasRole(code));
  }

  hasPermission(code: string): boolean {
    const candidate = normalize(code);
    return candidate.length > 0 && this.permissions().includes(candidate);
  }

  hasAllPermissions(codes: readonly string[]): boolean {
    return codes.every((code) => this.hasPermission(code));
  }
}

function publicError(error: unknown): PublicAuthorizationError {
  if (isAppApiError(error)) {
    return { code: error.code, requestId: error.requestId };
  }
  return { code: 'Unknown', requestId: null };
}
