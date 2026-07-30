import { InjectionToken } from '@angular/core';
import { type CredentialStore, InMemoryCredentialStore } from './credential-store';

/**
 * The seam through which a deployment chooses where the refresh credential
 * lives. Default: memory only — the sole browser option that promises nothing
 * it cannot keep (ADR-075).
 */
export const CREDENTIAL_STORE = new InjectionToken<CredentialStore>('CREDENTIAL_STORE', {
  providedIn: 'root',
  factory: () => new InMemoryCredentialStore(),
});
