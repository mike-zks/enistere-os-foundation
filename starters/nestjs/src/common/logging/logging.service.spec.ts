import { createPinoLogger, disableLogCapture, enableLogCapture } from './logging.config';
import { runWithRequestContext } from './request-context';
import { AppLogger } from './logging.service';

function build(level = 'trace'): { logger: AppLogger; read: () => Record<string, unknown>[] } {
  const sink = enableLogCapture();
  const logger = new AppLogger(
    createPinoLogger({ level, serviceName: 'api-nestjs-core', environment: 'test', pretty: false, toStderr: false }),
  );
  const read = (): Record<string, unknown>[] =>
    sink
      .join('')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  return { logger, read };
}

afterEach(() => disableLogCapture());

describe('AppLogger', () => {
  it('emits a structured JSON line with base fields and ISO timestamp', () => {
    const { logger, read } = build();
    logger.info({ operation: 'files.reconciliation', scanned: 100, changed: 3 }, 'File reconciliation completed');
    const [log] = read();
    expect(log.message).toBe('File reconciliation completed');
    expect(log.level).toBe('info');
    expect(log.service).toBe('api-nestjs-core');
    expect(log.environment).toBe('test');
    expect(log.operation).toBe('files.reconciliation');
    expect(log.scanned).toBe(100);
    expect(typeof log.timestamp).toBe('string');
    expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('redacts sensitive fields end-to-end', () => {
    const { logger, read } = build();
    logger.info({ password: 'TOPSECRET', headers: { authorization: 'Bearer X' }, keep: 'ok' }, 'm');
    const raw = JSON.stringify(read()[0]);
    expect(raw).not.toContain('TOPSECRET');
    expect(raw).not.toContain('Bearer X');
    expect(raw).toContain('"keep":"ok"');
  });

  it('keeps a plain url but redacts a signed url', () => {
    const { logger, read } = build();
    logger.info({ url: 'https://api/health' }, 'a');
    logger.info({ url: 'https://m/k?X-Amz-Signature=zzz' }, 'b');
    const logs = read();
    expect(logs[0].url).toBe('https://api/health');
    expect(logs[1].url).toBe('[Redacted]');
  });

  it('injects request context automatically via the mixin', () => {
    const { logger, read } = build();
    runWithRequestContext({ requestId: 'req-12345678', userId: 'u-1' }, () => {
      logger.info({ a: 1 }, 'inside');
    });
    logger.info({ a: 2 }, 'outside');
    const logs = read();
    expect(logs[0].requestId).toBe('req-12345678');
    expect(logs[0].userId).toBe('u-1');
    expect(logs[1].requestId).toBeUndefined();
  });

  it('supports the NestJS LoggerService signatures (log/error with context and stack)', () => {
    const { logger, read } = build();
    logger.log('hello', 'BootstrapContext');
    logger.error('boom', 'the-stack-trace', 'SomeContext');
    const logs = read();
    expect(logs[0]).toMatchObject({ level: 'info', message: 'hello', context: 'BootstrapContext' });
    expect(logs[1]).toMatchObject({ level: 'error', message: 'boom', stack: 'the-stack-trace', context: 'SomeContext' });
  });

  it('serializes an error passed under the `err` key (whitelist + scrub)', () => {
    const { logger, read } = build();
    logger.error({ err: new Error('db postgresql://u:secretpw@h/db') }, 'operation failed');
    const raw = JSON.stringify(read()[0]);
    expect(raw).not.toContain('secretpw');
    expect(raw).toContain('"errorType":"Error"');
  });

  it('respects the configured level (info dropped when level is warn)', () => {
    const { logger, read } = build('warn');
    logger.info({ a: 1 }, 'dropped');
    logger.warn({ a: 2 }, 'kept');
    const logs = read();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('kept');
  });

  it('emits a single HTTP completion log at the resolved level', () => {
    const { logger, read } = build();
    logger.logHttp('info', { requestId: 'r1', method: 'GET', route: '/files/:id', statusCode: 200, durationMs: 4 });
    const [log] = read();
    expect(log).toMatchObject({ level: 'info', method: 'GET', route: '/files/:id', statusCode: 200 });
    expect(log.message).toBe('http request completed');
  });
});
