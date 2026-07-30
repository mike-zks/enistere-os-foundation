/**
 * Where the refresh credential lives, as a replaceable seam (ADR-075).
 *
 * The interface exists for the same reason React Native's `SecureStorage` does:
 * the client depends on the contract, never on a platform API. The two runtimes
 * differ by implementation, never by architecture.
 *
 * A browser offers a static SPA no protected store — anything a script can write,
 * a script can read. The default implementation therefore keeps the credential in
 * memory: it cannot be exfiltrated by injected script from a previous page load,
 * and it disappears with the tab. The cost is explicit: a full reload signs the
 * user out.
 *
 * `localStorage` is deliberately absent and must stay absent: it would persist a
 * thirty-day credential in a store readable by any injected script.
 */
export interface CredentialStore {
  /** Returns the stored credential, or `null` when there is none. */
  read(): string | null;
  /** Stores `value`, replacing any previous credential. */
  write(value: string): void;
  /** Removes the credential. A no-op when there is none. */
  clear(): void;
}

/**
 * Default store: process memory only.
 *
 * Chosen as the default because it is the only browser option that makes no
 * false promise. A deployment that serves the API and the application same-site
 * should prefer an HttpOnly refresh cookie issued by the authority — the client
 * then holds nothing at all — which is why this is a seam and not a hard-coded
 * mechanism.
 */
export class InMemoryCredentialStore implements CredentialStore {
  #value: string | null = null;

  read(): string | null {
    return this.#value;
  }

  write(value: string): void {
    this.#value = value;
  }

  clear(): void {
    this.#value = null;
  }
}
