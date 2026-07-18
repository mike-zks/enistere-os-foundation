import { ConfigService } from '@nestjs/config';

import { AppConfig } from '../../config/configuration';
import { Argon2PasswordHasher } from './argon2-password-hasher';

function buildHasher(params: { memory?: number; time?: number; parallelism?: number } = {}): Argon2PasswordHasher {
  const values: Record<string, number> = {
    argon2MemoryCost: params.memory ?? 512,
    argon2TimeCost: params.time ?? 1,
    argon2Parallelism: params.parallelism ?? 1,
  };
  const configService = {
    get: (key: string): number => values[key],
  } as unknown as ConfigService<AppConfig, true>;

  return new Argon2PasswordHasher(configService);
}

describe('Argon2PasswordHasher', () => {
  const hasher = buildHasher();

  it('produces an Argon2id hash different from the plain password', async () => {
    const hash = await hasher.hash('correct horse battery staple');

    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hasher.hash('s3cret-password');

    await expect(hasher.verify(hash, 's3cret-password')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hasher.hash('s3cret-password');

    await expect(hasher.verify(hash, 'wrong-password')).resolves.toBe(false);
  });

  it('returns false for a malformed hash without throwing', async () => {
    await expect(hasher.verify('not-a-valid-hash', 'whatever')).resolves.toBe(false);
  });

  it('does not require rehash for a hash produced with the same parameters', async () => {
    const hash = await hasher.hash('s3cret-password');

    expect(hasher.needsRehash(hash)).toBe(false);
  });

  it('requires rehash when parameters change', async () => {
    const hash = await hasher.hash('s3cret-password');
    const strongerHasher = buildHasher({ memory: 1024 });

    expect(strongerHasher.needsRehash(hash)).toBe(true);
  });

  it('requires rehash for an unparseable hash', () => {
    expect(hasher.needsRehash('plain-text')).toBe(true);
  });
});
