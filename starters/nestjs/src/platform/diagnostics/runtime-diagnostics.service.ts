import { Injectable } from '@nestjs/common';

export type DiagnosticStatus = 'ok' | 'degraded';

export interface DiagnosticProbe {
  readonly id: string;
  check(): Promise<DiagnosticStatus>;
}

export interface DiagnosticSnapshot {
  status: DiagnosticStatus;
  timestamp: string;
  checks: Record<string, DiagnosticStatus>;
}

/**
 * Internal, sanitized diagnostics registry. Probe failures are converted to a
 * bounded state and never expose exception messages, hosts, credentials or
 * arbitrary payloads.
 */
@Injectable()
export class RuntimeDiagnosticsService {
  private readonly probes = new Map<string, DiagnosticProbe>();

  register(probe: DiagnosticProbe): void {
    if (!/^[a-z][a-z0-9-]{1,62}$/.test(probe.id)) {
      throw new Error(`Invalid diagnostic probe id: ${probe.id}`);
    }
    if (this.probes.has(probe.id)) {
      throw new Error(`Diagnostic probe already registered: ${probe.id}`);
    }
    this.probes.set(probe.id, probe);
  }

  async snapshot(): Promise<DiagnosticSnapshot> {
    const checks: Record<string, DiagnosticStatus> = {};
    for (const [id, probe] of [...this.probes.entries()].sort(([left], [right]) =>
      left.localeCompare(right))) {
      try {
        checks[id] = await probe.check();
      } catch {
        checks[id] = 'degraded';
      }
    }
    return {
      status: Object.values(checks).includes('degraded') ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
