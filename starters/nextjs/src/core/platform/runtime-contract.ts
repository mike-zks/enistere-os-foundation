export const COMMON_RUNTIME_CONTRACT_VERSION = "common/2.0.0";
export const WEB_RUNTIME_CONTRACT_VERSION = "web/2.0.0";
export const WEB_EXTENSION_CONTRACT_VERSION = "web-extension/1.0.0";
export const TELEMETRY_EXPORTER_CONTRACT_VERSION = "telemetry-exporter/1.0.0";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
const SENSITIVE_KEYS = /authorization|cookie|password|secret|token|body|payload/i;

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buffer);
  return Array.from(buffer, (value) => value.toString(16).padStart(2, "0")).join("");
}

export interface RequestContext {
  readonly requestId: string;
  readonly traceparent: string;
}

export function createRequestContext(input?: {
  readonly requestId?: string | null;
  readonly traceparent?: string | null;
}): RequestContext {
  const requestId = input?.requestId && REQUEST_ID_PATTERN.test(input.requestId)
    ? input.requestId
    : globalThis.crypto.randomUUID();
  const parent = input?.traceparent?.toLowerCase().match(TRACEPARENT_PATTERN);
  const traceId = parent?.[1] && !/^0+$/.test(parent[1]) ? parent[1] : randomHex(16);
  const flags = parent?.[3] ?? "01";
  return { requestId, traceparent: `00-${traceId}-${randomHex(8)}-${flags}` };
}

export type RuntimeFetch = (request: Request) => Promise<Response>;

export function withRequestContext(
  fetchImpl: RuntimeFetch,
  incoming?: { readonly requestId?: string | null; readonly traceparent?: string | null },
): RuntimeFetch {
  return async (input) => {
    const request = new Request(input);
    const context = createRequestContext({
      requestId: request.headers.get("x-request-id") ?? incoming?.requestId,
      traceparent: request.headers.get("traceparent") ?? incoming?.traceparent,
    });
    request.headers.set("x-request-id", context.requestId);
    request.headers.set("traceparent", context.traceparent);
    return fetchImpl(request);
  };
}

export type RuntimeLogLevel = "info" | "warn" | "error";
export type RuntimeLogSink = (record: Readonly<Record<string, unknown>>) => void;

export class StructuredLogger {
  constructor(private readonly sink: RuntimeLogSink = (record) => console.log(JSON.stringify(record))) {}

  write(
    level: RuntimeLogLevel,
    event: string,
    fields: Readonly<Record<string, unknown>> = {},
  ): void {
    const safeFields = Object.fromEntries(
      Object.entries(fields)
        .filter(([key]) => !SENSITIVE_KEYS.test(key))
        .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 256) : value]),
    );
    this.sink({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...safeFields,
    });
  }
}

export interface TelemetryExporter {
  readonly contractVersion: typeof TELEMETRY_EXPORTER_CONTRACT_VERSION;
  export(record: Readonly<Record<string, unknown>>): void;
}

const NOOP_EXPORTER: TelemetryExporter = {
  contractVersion: TELEMETRY_EXPORTER_CONTRACT_VERSION,
  export: () => undefined,
};

export class RuntimeTelemetry {
  private requestCount = 0;

  constructor(private readonly exporter: TelemetryExporter = NOOP_EXPORTER) {
    if (exporter.contractVersion !== TELEMETRY_EXPORTER_CONTRACT_VERSION) {
      throw new Error(`Unsupported telemetry exporter: ${exporter.contractVersion}`);
    }
  }

  recordRequest(context: RequestContext, outcome: "success" | "error", durationMs: number): void {
    this.requestCount += 1;
    this.exporter.export({
      type: "web.request",
      requestId: context.requestId,
      traceparent: context.traceparent,
      outcome,
      durationMs: Math.max(0, Math.round(durationMs)),
      requestCount: this.requestCount,
    });
  }

  get metrics(): Readonly<{ requestCount: number }> {
    return { requestCount: this.requestCount };
  }
}

export type TechnicalAuditEvent =
  | "runtime.started"
  | "runtime.stopped"
  | "runtime.error"
  | "configuration.rejected"
  | "extension.registered"
  | "security.rejected";

export class TechnicalAudit {
  constructor(private readonly logger: StructuredLogger) {}

  emit(event: TechnicalAuditEvent, context: Readonly<Record<string, unknown>> = {}): void {
    this.logger.write("info", `audit.${event}`, context);
  }
}

export type DiagnosticStatus = "ready" | "degraded";
export interface RuntimeDiagnostic {
  readonly id: string;
  readonly status: DiagnosticStatus;
  readonly reason?: string;
}

export class RuntimeDiagnostics {
  private readonly probes = new Map<string, () => RuntimeDiagnostic | Promise<RuntimeDiagnostic>>();

  register(id: string, probe: () => RuntimeDiagnostic | Promise<RuntimeDiagnostic>): () => void {
    if (!/^[a-z][a-z0-9.-]{1,63}$/.test(id) || this.probes.has(id)) {
      throw new Error(`Invalid or duplicate diagnostic: ${id}`);
    }
    this.probes.set(id, probe);
    return () => this.probes.delete(id);
  }

  async snapshot(): Promise<readonly RuntimeDiagnostic[]> {
    const entries = await Promise.all([...this.probes.entries()].map(async ([id, probe]) => {
      try {
        const value = await probe();
        return { id, status: value.status, ...(value.reason ? { reason: value.reason.slice(0, 128) } : {}) };
      } catch {
        return { id, status: "degraded" as const, reason: "probe-failed" };
      }
    }));
    return entries.sort((left, right) => left.id.localeCompare(right.id));
  }
}

export interface RuntimeLifecycleHook {
  readonly id: string;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
}

export class RuntimeLifecycle {
  private readonly hooks: RuntimeLifecycleHook[] = [];
  private running = false;
  private stopping: Promise<void> | null = null;

  register(hook: RuntimeLifecycleHook): () => void {
    if (this.hooks.some((candidate) => candidate.id === hook.id)) {
      throw new Error(`Duplicate lifecycle hook: ${hook.id}`);
    }
    this.hooks.push(hook);
    return () => {
      const index = this.hooks.indexOf(hook);
      if (index >= 0) this.hooks.splice(index, 1);
    };
  }

  async start(): Promise<void> {
    if (this.running) return;
    for (const hook of this.hooks) await hook.start();
    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    if (this.stopping) return this.stopping;
    this.stopping = (async () => {
      for (const hook of [...this.hooks].reverse()) await hook.stop();
      this.running = false;
      this.stopping = null;
    })();
    return this.stopping;
  }
}

export type WebExtensionKind = "session" | "access-control";
export interface WebRuntimeExtension {
  readonly id: string;
  readonly kind: WebExtensionKind;
  readonly contractVersion: typeof WEB_EXTENSION_CONTRACT_VERSION;
}

export class WebRuntimeExtensionRegistry {
  private readonly extensions = new Map<WebExtensionKind, WebRuntimeExtension>();

  register(extension: WebRuntimeExtension): () => void {
    if (extension.contractVersion !== WEB_EXTENSION_CONTRACT_VERSION) {
      throw new Error(`Unsupported web extension contract: ${extension.contractVersion}`);
    }
    if (this.extensions.has(extension.kind)) {
      throw new Error(`Web extension already registered: ${extension.kind}`);
    }
    this.extensions.set(extension.kind, extension);
    return () => {
      if (this.extensions.get(extension.kind) === extension) this.extensions.delete(extension.kind);
    };
  }

  resolve(kind: WebExtensionKind): WebRuntimeExtension | null {
    return this.extensions.get(kind) ?? null;
  }
}

export const runtimeLogger = new StructuredLogger();
export const runtimeTelemetry = new RuntimeTelemetry();
export const technicalAudit = new TechnicalAudit(runtimeLogger);
export const runtimeDiagnostics = new RuntimeDiagnostics();
export const runtimeLifecycle = new RuntimeLifecycle();
export const webRuntimeExtensions = new WebRuntimeExtensionRegistry();
