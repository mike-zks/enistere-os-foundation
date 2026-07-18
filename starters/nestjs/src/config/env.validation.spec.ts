import 'reflect-metadata';

import { validateEnv } from './env.validation';

const VALID: Record<string, unknown> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/db?schema=public',
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  REFRESH_TOKEN_HASH_SECRET: 'hash-secret',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_BUCKET: 'bucket',
};

describe('validateEnv', () => {
  it('accepts a valid minimal configuration and applies defaults', () => {
    const config = validateEnv({ ...VALID });
    expect(config.JWT_ACCESS_TTL).toBe(900);
    expect(config.JSON_BODY_LIMIT).toBe('1mb');
    expect(config.TRUST_PROXY_HOPS).toBe(0);
    expect(config.FILES_SIGNED_READ_URL_TTL_SECONDS).toBe(300);
  });

  it.each([
    ['JWT_ACCESS_SECRET', { JWT_ACCESS_SECRET: '' }],
    ['JWT_REFRESH_SECRET', { JWT_REFRESH_SECRET: undefined }],
    ['REFRESH_TOKEN_HASH_SECRET', { REFRESH_TOKEN_HASH_SECRET: '' }],
    ['DATABASE_URL', { DATABASE_URL: undefined }],
    ['S3_BUCKET', { S3_BUCKET: '' }],
    ['S3_ENDPOINT', { S3_ENDPOINT: undefined }],
  ])('rejects a missing/empty secret-like variable: %s', (_label, override) => {
    expect(() => validateEnv({ ...VALID, ...override })).toThrow(/Invalid environment configuration/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...VALID, NODE_ENV: 'staging-typo' })).toThrow();
  });

  it('rejects a signed-read-url TTL below the minimum bound (30s)', () => {
    expect(() => validateEnv({ ...VALID, FILES_SIGNED_READ_URL_TTL_SECONDS: 10 })).toThrow();
  });

  it('rejects a signed-read-url TTL above the maximum bound (900s)', () => {
    expect(() => validateEnv({ ...VALID, FILES_SIGNED_READ_URL_TTL_SECONDS: 100000 })).toThrow();
  });

  it('rejects a negative trust-proxy hop count', () => {
    expect(() => validateEnv({ ...VALID, TRUST_PROXY_HOPS: -1 })).toThrow();
  });

  it('rejects an empty body-parser limit', () => {
    expect(() => validateEnv({ ...VALID, JSON_BODY_LIMIT: '' })).toThrow();
  });

  it('applies logging defaults (service name, level info, http enabled)', () => {
    const config = validateEnv({ ...VALID });
    expect(config.SERVICE_NAME).toBe('api-nestjs-core');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.LOG_PRETTY).toBe(false);
    expect(config.LOG_HTTP_ENABLED).toBe(true);
    expect(config.LOG_HEALTH_SUCCESS_ENABLED).toBe(false);
  });

  it('accepts the documented log levels', () => {
    for (const level of ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']) {
      expect(validateEnv({ ...VALID, LOG_LEVEL: level }).LOG_LEVEL).toBe(level);
    }
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(() => validateEnv({ ...VALID, LOG_LEVEL: 'verbose' })).toThrow();
  });

  it('transforms boolean logging flags from strings', () => {
    const config = validateEnv({ ...VALID, LOG_PRETTY: 'true', LOG_HTTP_ENABLED: 'false' });
    expect(config.LOG_PRETTY).toBe(true);
    expect(config.LOG_HTTP_ENABLED).toBe(false);
  });
});
