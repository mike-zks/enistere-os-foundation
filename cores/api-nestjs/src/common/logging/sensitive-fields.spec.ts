import { redactDeep, scrubString } from './sensitive-fields';

describe('redactDeep', () => {
  it('redacts sensitive keys at any depth (objects and arrays)', () => {
    const input = {
      ok: 'visible',
      password: 'TOPSECRET',
      nested: { accessToken: 'T', deeper: { secret: 'S' } },
      list: [{ refreshToken: 'R' }, { keep: 1 }],
      authorization: 'Bearer abc',
    };
    const out = redactDeep(input);
    const raw = JSON.stringify(out);
    expect(out.ok).toBe('visible');
    expect(out.password).toBe('[Redacted]');
    expect(raw).not.toContain('TOPSECRET');
    expect(raw).not.toContain('Bearer abc');
    expect(raw).not.toContain('"T"');
    expect(raw).not.toContain('"R"');
    expect(raw).not.toContain('"S"');
    expect(raw).toContain('"keep":1');
  });

  it('redacts a signed URL value but keeps a plain technical URL', () => {
    const out = redactDeep({
      url: 'https://minio.local/bucket/key?X-Amz-Signature=deadbeef',
      callbackUrl: 'https://api.example.test/health',
    });
    expect(out.url).toBe('[Redacted]');
    expect(out.callbackUrl).toBe('https://api.example.test/health');
  });

  it('handles circular references safely', () => {
    const a: Record<string, unknown> = { name: 'a' };
    a.self = a;
    const out = redactDeep(a);
    expect(out.name).toBe('a');
    expect(out.self).toBe('[Circular]');
  });
});

describe('scrubString', () => {
  it('masks credentials in connection strings', () => {
    expect(scrubString('postgresql://user:s3cr3t@host:5432/db')).toBe('postgresql://user:[Redacted]@host:5432/db');
  });
  it('masks signed-url params and bearer tokens', () => {
    expect(scrubString('GET /x?X-Amz-Signature=abc123&y=1')).toContain('x-amz-signature=[Redacted]');
    expect(scrubString('Authorization: Bearer eyJabc.def')).toContain('Bearer [Redacted]');
  });
});
