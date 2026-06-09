import { ConflictException } from '@nestjs/common';

import { serializeError } from './error-serializer';

describe('serializeError', () => {
  it('whitelists fields for a plain Error (type, message, stack)', () => {
    const out = serializeError(new Error('boom'));
    expect(out.errorType).toBe('Error');
    expect(out.message).toBe('boom');
    expect(typeof out.stack).toBe('string');
    expect(out).not.toHaveProperty('config');
  });

  it('extracts the applicative code from a NestJS HttpException', () => {
    const out = serializeError(new ConflictException({ code: 'FILE_NOT_DOWNLOADABLE', message: 'no' }));
    expect(out.errorCode).toBe('FILE_NOT_DOWNLOADABLE');
  });

  it('never serializes the full external object (e.g. AWS SDK with credentials)', () => {
    const awsLike = Object.assign(new Error('AccessDenied'), {
      name: 'AccessDenied',
      $metadata: { httpStatusCode: 403 },
      config: { credentials: { accessKeyId: 'AKIA_SECRET', secretAccessKey: 'SECRET_VALUE' } },
    });
    const out = serializeError(awsLike);
    const raw = JSON.stringify(out);
    expect(out.errorType).toBe('AccessDenied');
    expect(raw).not.toContain('AKIA_SECRET');
    expect(raw).not.toContain('SECRET_VALUE');
    expect(raw).not.toContain('config');
  });

  it('scrubs connection strings inside the message', () => {
    const out = serializeError(new Error('connect failed: postgresql://user:p4ss@db:5432/app'));
    expect(out.message).not.toContain('p4ss');
    expect(out.message).toContain('[Redacted]');
  });

  it('serializes a cause without leaking its internals', () => {
    const err = new Error('outer', { cause: new Error('inner postgresql://u:secretpw@h/db') });
    const out = serializeError(err);
    expect(typeof out.cause).toBe('object');
    expect(JSON.stringify(out.cause)).not.toContain('secretpw');
  });

  it('handles non-Error throwables', () => {
    expect(serializeError('just a string').message).toBe('just a string');
    expect(serializeError(42).errorType).toBe('number');
  });
});
