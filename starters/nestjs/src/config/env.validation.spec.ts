import 'reflect-metadata';

import { validateEnv } from './env.validation';

const VALID: Record<string, unknown> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/db?schema=public',
};

describe('validateEnv', () => {
  it('accepts a valid minimal configuration and applies defaults', () => {
    const config = validateEnv({ ...VALID });
    expect(config.JSON_BODY_LIMIT).toBe('1mb');
    expect(config.TRUST_PROXY_HOPS).toBe(0);
    expect(config.CORS_ORIGINS).toBe('');
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({ ...VALID, DATABASE_URL: undefined })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...VALID, NODE_ENV: 'staging-typo' })).toThrow();
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
