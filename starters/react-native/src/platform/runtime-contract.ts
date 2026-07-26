import { createLogger, type LogRecord, type LogSink } from '../logger/logger';
import { redactValue } from '../logger/redaction';

export const COMMON_RUNTIME_CONTRACT_VERSION = 'common/2.0.0';
export const MOBILE_RUNTIME_CONTRACT_VERSION = 'mobile/2.0.0';
export const TELEMETRY_EXPORTER_CONTRACT_VERSION = 'telemetry-exporter/2.0.0';
export const MOBILE_EXTENSION_CONTRACT_VERSION = 'mobile-extension/2.0.0';

export interface RuntimeConfiguration {
  readonly environment: 'local' | 'staging' | 'production';
  readonly apiBaseUrl: string;
  readonly requestTimeoutMs: number;
}

export function validateRuntimeConfiguration(
  input: Readonly<Record<string, string | undefined>>,
): RuntimeConfiguration {
  const environment = input.EXPO_PUBLIC_APP_ENV ?? 'local';
  if (!['local', 'staging', 'production'].includes(environment)) {
    throw new Error('EXPO_PUBLIC_APP_ENV must be local, staging or production.');
  }
  const apiBaseUrl = new URL(input.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000');
  if (environment === 'production' && apiBaseUrl.protocol !== 'https:') {
    throw new Error('Production API endpoints must use HTTPS.');
  }
  const requestTimeoutMs = Number(input.EXPO_PUBLIC_API_TIMEOUT_MS ?? '15000');
  if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 100 || requestTimeoutMs > 120_000) {
    throw new Error('EXPO_PUBLIC_API_TIMEOUT_MS must be an integer between 100 and 120000.');
  }
  return Object.freeze({
    environment: environment as RuntimeConfiguration['environment'],
    apiBaseUrl: apiBaseUrl.toString().replace(/\/$/, ''),
    requestTimeoutMs,
  });
}

export interface CanonicalMobileError {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly message: string;
  readonly details: unknown;
  readonly path: string;
  readonly timestamp: string;
  readonly requestId: string;
}

export function mapCanonicalMobileError(value: unknown): CanonicalMobileError {
  const candidate = value as Partial<CanonicalMobileError> | null;
  if (
    !candidate
    || !Number.isInteger(candidate.statusCode)
    || typeof candidate.errorCode !== 'string'
    || typeof candidate.message !== 'string'
    || typeof candidate.path !== 'string'
    || typeof candidate.timestamp !== 'string'
    || typeof candidate.requestId !== 'string'
  ) {
    return {
      statusCode: 0,
      errorCode: 'NETWORK_ERROR',
      message: 'The request could not be completed.',
      details: null,
      path: '',
      timestamp: new Date(0).toISOString(),
      requestId: '',
    };
  }
  return {
    statusCode: candidate.statusCode as number,
    errorCode: candidate.errorCode,
    message: candidate.message,
    details: candidate.details ?? null,
    path: candidate.path,
    timestamp: candidate.timestamp,
    requestId: candidate.requestId,
  };
}

const TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

export interface MobileRequestContext {
  readonly requestId: string;
  readonly traceparent: string;
}

export function createMobileRequestContext(options: {
  readonly incomingTraceparent?: string;
  readonly requestId: string;
  readonly nextTraceId: () => string;
  readonly nextSpanId: () => string;
}): MobileRequestContext {
  if (!options.requestId.trim()) throw new Error('requestId is required.');
  const incoming = options.incomingTraceparent?.toLowerCase().match(TRACEPARENT);
  const traceId = incoming?.[1] ?? options.nextTraceId();
  const flags = incoming?.[3] ?? '01';
  const spanId = options.nextSpanId();
  if (!/^[0-9a-f]{32}$/.test(traceId) || !/^[0-9a-f]{16}$/.test(spanId)) {
    throw new Error('Trace and span identifiers must be lowercase hexadecimal W3C identifiers.');
  }
  return Object.freeze({
    requestId: options.requestId,
    traceparent: `00-${traceId}-${spanId}-${flags}`,
  });
}

export type TechnicalAuditSink = (event: Readonly<Record<string, unknown>>) => void;

export class TechnicalAudit {
  constructor(
    private readonly sink: TechnicalAuditSink,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  record(
    action: string,
    outcome: 'success' | 'failure',
    context: MobileRequestContext,
    fields: Readonly<Record<string, unknown>> = {},
  ): void {
    this.sink(Object.freeze(redactValue({
      eventType: 'technical-audit',
      action,
      outcome,
      requestId: context.requestId,
      traceparent: context.traceparent,
      timestamp: this.clock(),
      fields,
    }) as Record<string, unknown>));
  }
}

export interface MobileTelemetryExporter {
  readonly contractVersion: typeof TELEMETRY_EXPORTER_CONTRACT_VERSION;
  export(record: Readonly<Record<string, unknown>>): void;
}

export class RuntimeTelemetry {
  private readonly counters = new Map<string, number>();

  constructor(
    private readonly exporter: MobileTelemetryExporter,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  record(name: string, context: MobileRequestContext, fields: Readonly<Record<string, unknown>> = {}): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + 1);
    this.exporter.export(Object.freeze(redactValue({
      name,
      timestamp: this.clock(),
      requestId: context.requestId,
      traceparent: context.traceparent,
      fields,
    }) as Record<string, unknown>));
  }

  count(name: string): number {
    return this.counters.get(name) ?? 0;
  }
}

export interface DiagnosticCheck {
  readonly id: string;
  run(): 'ready' | 'degraded' | 'unavailable';
}

export class RuntimeDiagnostics {
  private readonly checks = new Map<string, DiagnosticCheck>();

  register(check: DiagnosticCheck): void {
    if (!/^[a-z][a-z0-9.-]*$/.test(check.id) || this.checks.has(check.id)) {
      throw new Error(`Invalid or duplicate diagnostic check: ${check.id}`);
    }
    this.checks.set(check.id, check);
  }

  snapshot(): readonly Readonly<{ id: string; status: string }>[] {
    return [...this.checks.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((check) => Object.freeze({ id: check.id, status: check.run() }));
  }
}

export interface RuntimeLifecycleHook {
  readonly id: string;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
}

export class RuntimeLifecycle {
  private started: RuntimeLifecycleHook[] = [];

  constructor(private readonly hooks: readonly RuntimeLifecycleHook[]) {}

  async start(): Promise<void> {
    if (this.started.length) return;
    for (const hook of this.hooks) {
      await hook.start();
      this.started.push(hook);
    }
  }

  async stop(): Promise<void> {
    for (const hook of [...this.started].reverse()) await hook.stop();
    this.started = [];
  }
}

export type MobileExtensionKind =
  | 'secure-storage'
  | 'session'
  | 'offline'
  | 'push'
  | 'crash-reporting';

export interface MobileRuntimeExtension {
  readonly kind: MobileExtensionKind;
  readonly contractVersion: typeof MOBILE_EXTENSION_CONTRACT_VERSION;
  readonly id: string;
}

export class MobileRuntimeExtensionRegistry {
  private readonly extensions = new Map<MobileExtensionKind, MobileRuntimeExtension>();

  register(extension: MobileRuntimeExtension): void {
    if (extension.contractVersion !== MOBILE_EXTENSION_CONTRACT_VERSION) {
      throw new Error(`Unsupported mobile extension contract: ${extension.contractVersion}`);
    }
    if (this.extensions.has(extension.kind)) {
      throw new Error(`A ${extension.kind} extension is already registered.`);
    }
    this.extensions.set(extension.kind, Object.freeze({ ...extension }));
  }

  get(kind: MobileExtensionKind): MobileRuntimeExtension | undefined {
    return this.extensions.get(kind);
  }
}

export function createRuntimeLogger(sink: LogSink): ReturnType<typeof createLogger> {
  return createLogger({ sink, level: 'debug' });
}

export type { LogRecord };
