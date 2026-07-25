import { RuntimeDiagnosticsService } from './runtime-diagnostics.service';

describe('RuntimeDiagnosticsService', () => {
  it('returns sorted, sanitized probe states', async () => {
    const diagnostics = new RuntimeDiagnosticsService();
    diagnostics.register({ id: 'storage', check: () => Promise.resolve('ok') });
    diagnostics.register({ id: 'cache', check: () => Promise.reject(new Error('redis://secret')) });

    const snapshot = await diagnostics.snapshot();

    expect(snapshot.status).toBe('degraded');
    expect(snapshot.checks).toEqual({ cache: 'degraded', storage: 'ok' });
    expect(JSON.stringify(snapshot)).not.toContain('secret');
    expect(snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('refuses ambiguous or unsafe probe identifiers', () => {
    const diagnostics = new RuntimeDiagnosticsService();
    diagnostics.register({ id: 'database', check: () => Promise.resolve('ok') });
    expect(() => diagnostics.register({ id: 'database', check: () => Promise.resolve('ok') }))
      .toThrow('already registered');
    expect(() => diagnostics.register({ id: '../secret', check: () => Promise.resolve('ok') }))
      .toThrow('Invalid diagnostic probe id');
  });
});
