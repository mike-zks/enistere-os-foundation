export const SECURE_STORAGE_CONTRACT_VERSION = 'secure-storage/2.0.0';

export interface SecureStorageAdapter {
  readonly contractVersion: typeof SECURE_STORAGE_CONTRACT_VERSION;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export class SecureStorage {
  constructor(private readonly adapter: SecureStorageAdapter) {
    if (adapter.contractVersion !== SECURE_STORAGE_CONTRACT_VERSION) {
      throw new Error(`Unsupported secure-storage contract: ${adapter.contractVersion}`);
    }
  }

  get(key: string): Promise<string | null> {
    assertSafeKey(key);
    return this.adapter.get(key);
  }

  set(key: string, value: string): Promise<void> {
    assertSafeKey(key);
    if (!value) throw new Error('Secure-storage values must not be empty.');
    return this.adapter.set(key, value);
  }

  remove(key: string): Promise<void> {
    assertSafeKey(key);
    return this.adapter.remove(key);
  }
}

function assertSafeKey(key: string): void {
  if (!/^[a-z][a-z0-9._-]{1,127}$/.test(key)) {
    throw new Error('Secure-storage keys must be scoped, stable identifiers.');
  }
}
