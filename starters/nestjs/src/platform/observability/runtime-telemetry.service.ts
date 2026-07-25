import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

export const TELEMETRY_EXTENSION_CONTRACT_VERSION = 'telemetry/2.0.0' as const;
const TRACEPARENT_PATTERN =
  /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

export interface RequestMeasurement {
  method: string;
  route?: string;
  statusCode: number;
  durationMs: number;
  traceId: string;
}

/** Hook destiné à un adapter OpenTelemetry, sans imposer de backend au starter. */
export interface TelemetryExporter {
  readonly contractVersion: string;
  exportRequest(measurement: RequestMeasurement): void | Promise<void>;
}

export interface TraceContext {
  traceId: string;
  traceparent: string;
}

export function continueTraceparent(value: string | undefined): TraceContext {
  const match = value?.toLowerCase().match(TRACEPARENT_PATTERN);
  const valid =
    match &&
    match[1] !== '00000000000000000000000000000000' &&
    match[2] !== '0000000000000000';
  const traceId = valid ? match[1] : randomBytes(16).toString('hex');
  const flags = valid ? match[3] : '01';
  const spanId = randomBytes(8).toString('hex');
  return { traceId, traceparent: `00-${traceId}-${spanId}-${flags}` };
}

/**
 * Instrumentation minimale toujours disponible. Elle expose des métriques
 * agrégées sans labels non bornés et un hook explicite vers OpenTelemetry.
 */
@Injectable()
export class RuntimeTelemetryService {
  private requests = 0;
  private errors = 0;
  private totalDurationMs = 0;
  private exporter?: TelemetryExporter;

  registerExporter(exporter: TelemetryExporter): void {
    if (exporter.contractVersion !== TELEMETRY_EXTENSION_CONTRACT_VERSION) {
      throw new Error(`Unsupported telemetry contract: ${exporter.contractVersion}`);
    }
    if (this.exporter) throw new Error('A telemetry exporter is already registered');
    this.exporter = exporter;
  }

  recordRequest(measurement: RequestMeasurement): void {
    this.requests += 1;
    this.totalDurationMs += measurement.durationMs;
    if (measurement.statusCode >= 500) this.errors += 1;
    try {
      const exported = this.exporter?.exportRequest(measurement);
      if (exported instanceof Promise) {
        // La télémétrie ne doit jamais faire échouer la requête instrumentée.
        void exported.catch(() => undefined);
      }
    } catch {
      // La métrique locale reste acquise ; le backend/exporter est best-effort.
    }
  }

  snapshot(): Readonly<{
    requests: number;
    errors: number;
    averageDurationMs: number;
    exporterConfigured: boolean;
  }> {
    return {
      requests: this.requests,
      errors: this.errors,
      averageDurationMs: this.requests === 0 ? 0 : this.totalDurationMs / this.requests,
      exporterConfigured: Boolean(this.exporter),
    };
  }
}
