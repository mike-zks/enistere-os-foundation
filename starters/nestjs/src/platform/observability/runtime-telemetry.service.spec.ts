import {
  continueTraceparent,
  RuntimeTelemetryService,
  TELEMETRY_EXTENSION_CONTRACT_VERSION,
} from './runtime-telemetry.service';

describe('RuntimeTelemetryService', () => {
  it('continues valid W3C context and replaces invalid context', () => {
    const parent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const continued = continueTraceparent(parent);
    expect(continued.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(continued.traceparent).toMatch(
      /^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/,
    );

    const regenerated = continueTraceparent('00-00000000000000000000000000000000-0000000000000000-01');
    expect(regenerated.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(regenerated.traceId).not.toBe('00000000000000000000000000000000');
  });

  it('records bounded metrics and invokes the versioned exporter hook', () => {
    const telemetry = new RuntimeTelemetryService();
    const exportRequest = jest.fn();
    telemetry.registerExporter({
      contractVersion: TELEMETRY_EXTENSION_CONTRACT_VERSION,
      exportRequest,
    });
    telemetry.recordRequest({
      method: 'GET',
      route: '/health',
      statusCode: 503,
      durationMs: 12,
      traceId: 'a'.repeat(32),
    });

    expect(telemetry.snapshot()).toEqual({
      requests: 1,
      errors: 1,
      averageDurationMs: 12,
      exporterConfigured: true,
    });
    expect(exportRequest).toHaveBeenCalledTimes(1);
  });

  it('never propagates an exporter failure to the instrumented request', () => {
    const telemetry = new RuntimeTelemetryService();
    telemetry.registerExporter({
      contractVersion: TELEMETRY_EXTENSION_CONTRACT_VERSION,
      exportRequest: () => { throw new Error('collector unavailable'); },
    });

    expect(() =>
      telemetry.recordRequest({
        method: 'GET',
        statusCode: 200,
        durationMs: 1,
        traceId: 'b'.repeat(32),
      }),
    ).not.toThrow();
    expect(telemetry.snapshot().requests).toBe(1);
  });
});
