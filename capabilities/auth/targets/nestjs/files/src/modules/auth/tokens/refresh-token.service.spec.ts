import { ConfigType } from '@nestjs/config';

import { authConfig } from '../auth.config';
import { RefreshTokenService } from './refresh-token.service';

function buildService(hashSecret = 'test-refresh-hash-secret'): RefreshTokenService {
  const config = {
    refreshTokenHashSecret: hashSecret,
  } as ConfigType<typeof authConfig>;

  return new RefreshTokenService(config);
}

describe('RefreshTokenService', () => {
  const service = buildService();

  it('generates a URL-safe secret with sufficient entropy', () => {
    const secret = service.generateSecret();

    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(40);
  });

  it('generates a different secret each time', () => {
    expect(service.generateSecret()).not.toBe(service.generateSecret());
  });

  it('builds an opaque token in the form <sessionId>.<secret>', () => {
    expect(service.buildToken('session-1', 'secret-1')).toBe('session-1.secret-1');
  });

  it('produces a deterministic 64-char hex fingerprint for a given secret', () => {
    const first = service.fingerprint('a-secret');
    const second = service.fingerprint('a-secret');

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces different fingerprints for different secrets', () => {
    expect(service.fingerprint('secret-a')).not.toBe(service.fingerprint('secret-b'));
  });

  it('produces different fingerprints under a different server hash secret', () => {
    const other = buildService('another-server-secret');

    expect(service.fingerprint('same-secret')).not.toBe(other.fingerprint('same-secret'));
  });

  describe('parse', () => {
    const sessionId = '11111111-1111-1111-1111-111111111111';
    const secret = service.generateSecret();

    it('parses a valid token into sessionId and secret', () => {
      expect(service.parse(`${sessionId}.${secret}`)).toEqual({ sessionId, secret });
    });

    it('rejects a token without a secret segment', () => {
      expect(service.parse(sessionId)).toBeNull();
    });

    it('rejects a token with an extra segment', () => {
      expect(service.parse(`${sessionId}.${secret}.extra`)).toBeNull();
    });

    it('rejects an invalid session UUID', () => {
      expect(service.parse(`not-a-uuid.${secret}`)).toBeNull();
    });

    it('rejects a secret with invalid characters', () => {
      expect(service.parse(`${sessionId}.has spaces and.dots`)).toBeNull();
      expect(service.parse(`${sessionId}.contains+slash/and=`)).toBeNull();
    });

    it('rejects an excessively long secret', () => {
      expect(service.parse(`${sessionId}.${'a'.repeat(200)}`)).toBeNull();
    });

    it('rejects a token containing whitespace', () => {
      expect(service.parse(`${sessionId}.${secret} `)).toBeNull();
    });
  });

  describe('matches', () => {
    it('matches the fingerprint of the same secret', () => {
      const secret = service.generateSecret();
      expect(service.matches(secret, service.fingerprint(secret))).toBe(true);
    });

    it('does not match a different secret', () => {
      const secret = service.generateSecret();
      expect(service.matches('another-secret', service.fingerprint(secret))).toBe(false);
    });

    it('does not match a fingerprint of different length', () => {
      const secret = service.generateSecret();
      expect(service.matches(secret, 'too-short')).toBe(false);
    });
  });
});
