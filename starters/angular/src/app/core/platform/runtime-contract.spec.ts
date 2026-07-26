import {
  createRequestContext,
  RuntimeDiagnostics,
  RuntimeLifecycle,
  RuntimeTelemetry,
  StructuredLogger,
  TechnicalAudit,
  TELEMETRY_EXPORTER_CONTRACT_VERSION,
  WEB_EXTENSION_CONTRACT_VERSION,
  WebRuntimeExtensionRegistry,
} from './runtime-contract';

describe('Web Runtime Contract', () => {
  it('continues W3C context with a new span and preserves a safe request id', () => {
    const context = createRequestContext({
      requestId: 'web-request-1234',
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    });
    expect(context.requestId).toBe('web-request-1234');
    expect(context.traceparent).toMatch(/^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);
    expect(context.traceparent).not.toContain('00f067aa0ba902b7');
  });

  it('redacts technical audit fields that can carry secrets', () => {
    const records: Readonly<Record<string, unknown>>[] = [];
    const logger = new StructuredLogger((record) => records.push(record));
    new TechnicalAudit(logger).emit('security.rejected', {
      requestId: 'web-request-1234',
      token: 'never-log-me',
      payload: 'never-log-me-either',
    });
    expect(records[0]?.['event']).toBe('audit.security.rejected');
    expect(records[0]?.['requestId']).toBe('web-request-1234');
    expect(records[0]?.['token']).toBeUndefined();
    expect(records[0]?.['payload']).toBeUndefined();
  });

  it('proves versioned telemetry, request metrics and trace propagation', () => {
    const records: Readonly<Record<string, unknown>>[] = [];
    const telemetry = new RuntimeTelemetry({
      contractVersion: TELEMETRY_EXPORTER_CONTRACT_VERSION,
      export: (record) => records.push(record),
    });
    telemetry.recordRequest(createRequestContext({ requestId: 'web-request-1234' }), 'success', 12.4);
    expect(telemetry.metrics.requestCount).toBe(1);
    expect(records[0]?.['requestId']).toBe('web-request-1234');
    expect(records[0]?.['traceparent']).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it('sorts diagnostics and sanitizes probe failures', async () => {
    const diagnostics = new RuntimeDiagnostics();
    diagnostics.register('zeta.probe', () => { throw new Error('secret'); });
    diagnostics.register('alpha.probe', () => ({
      id: 'ignored',
      status: 'degraded',
      reason: 'x'.repeat(500),
    }));
    const snapshot = await diagnostics.snapshot();
    expect(snapshot.map((item) => item.id)).toEqual(['alpha.probe', 'zeta.probe']);
    expect(snapshot[0]?.reason?.length).toBe(128);
    expect(snapshot[1]?.reason).toBe('probe-failed');
  });

  it('starts in order and stops idempotently in reverse order', async () => {
    const events: string[] = [];
    const lifecycle = new RuntimeLifecycle();
    lifecycle.register({
      id: 'first',
      start: () => { events.push('start:first'); },
      stop: () => { events.push('stop:first'); },
    });
    lifecycle.register({
      id: 'second',
      start: () => { events.push('start:second'); },
      stop: () => { events.push('stop:second'); },
    });
    await lifecycle.start();
    await lifecycle.start();
    await Promise.all([lifecycle.stop(), lifecycle.stop()]);
    expect(events).toEqual(['start:first', 'start:second', 'stop:second', 'stop:first']);
  });

  it('keeps session and access-control extensions versioned and exclusive', () => {
    const registry = new WebRuntimeExtensionRegistry();
    registry.register({ id: 'session.test', kind: 'session', contractVersion: WEB_EXTENSION_CONTRACT_VERSION });
    registry.register({ id: 'access.test', kind: 'access-control', contractVersion: WEB_EXTENSION_CONTRACT_VERSION });
    expect(registry.resolve('session')?.id).toBe('session.test');
    expect(() => registry.register({
      id: 'duplicate',
      kind: 'session',
      contractVersion: WEB_EXTENSION_CONTRACT_VERSION,
    })).toThrowError(/already registered/);
  });
});
