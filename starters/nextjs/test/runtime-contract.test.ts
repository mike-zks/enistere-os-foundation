import assert from "node:assert/strict";
import { test } from "node:test";

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
  withRequestContext,
} from "../src/core/platform/runtime-contract.js";

test("continues a valid W3C trace with a new span and preserves a safe request id", () => {
  const context = createRequestContext({
    requestId: "web-request-1234",
    traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  });
  assert.equal(context.requestId, "web-request-1234");
  assert.match(context.traceparent, /^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);
  assert.ok(!context.traceparent.includes("00f067aa0ba902b7"));
});

test("injects correlation headers without leaking request content", async () => {
  let captured: Request | undefined;
  const wrapped = withRequestContext(async (request) => {
    captured = request instanceof Request ? request : new Request(request);
    return new Response(null, { status: 204 });
  });
  await wrapped(new Request("https://example.test/health?token=secret", {
    headers: { "x-request-id": "web-request-1234" },
  }));
  assert.equal(captured?.headers.get("x-request-id"), "web-request-1234");
  assert.match(captured?.headers.get("traceparent") ?? "", /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
});

test("structured logging and technical audit redact sensitive fields", () => {
  const records: Readonly<Record<string, unknown>>[] = [];
  const logger = new StructuredLogger((record) => records.push(record));
  new TechnicalAudit(logger).emit("security.rejected", {
    requestId: "web-request-1234",
    token: "never-log-me",
    payload: "never-log-me-either",
  });
  assert.equal(records.length, 1);
  assert.equal(records[0]?.event, "audit.security.rejected");
  assert.equal(records[0]?.requestId, "web-request-1234");
  assert.ok(!("token" in (records[0] ?? {})));
  assert.ok(!("payload" in (records[0] ?? {})));
});

test("telemetry exporter is versioned and records metrics plus trace context", () => {
  const records: Readonly<Record<string, unknown>>[] = [];
  const telemetry = new RuntimeTelemetry({
    contractVersion: TELEMETRY_EXPORTER_CONTRACT_VERSION,
    export: (record) => records.push(record),
  });
  const context = createRequestContext({ requestId: "web-request-1234" });
  telemetry.recordRequest(context, "success", 12.4);
  assert.equal(telemetry.metrics.requestCount, 1);
  assert.equal(records[0]?.requestId, "web-request-1234");
  assert.equal(records[0]?.durationMs, 12);
});

test("diagnostics are sorted, bounded and sanitize probe failures", async () => {
  const diagnostics = new RuntimeDiagnostics();
  diagnostics.register("zeta.probe", () => { throw new Error("secret"); });
  diagnostics.register("alpha.probe", () => ({
    id: "ignored",
    status: "degraded",
    reason: "x".repeat(500),
  }));
  const snapshot = await diagnostics.snapshot();
  assert.deepEqual(snapshot.map((item) => item.id), ["alpha.probe", "zeta.probe"]);
  assert.equal(snapshot[0]?.reason?.length, 128);
  assert.equal(snapshot[1]?.reason, "probe-failed");
});

test("lifecycle starts in order and stops once in reverse order", async () => {
  const events: string[] = [];
  const lifecycle = new RuntimeLifecycle();
  lifecycle.register({
    id: "first",
    start: () => { events.push("start:first"); },
    stop: () => { events.push("stop:first"); },
  });
  lifecycle.register({
    id: "second",
    start: () => { events.push("start:second"); },
    stop: () => { events.push("stop:second"); },
  });
  await lifecycle.start();
  await lifecycle.start();
  await Promise.all([lifecycle.stop(), lifecycle.stop()]);
  assert.deepEqual(events, ["start:first", "start:second", "stop:second", "stop:first"]);
});

test("session and access-control extension points are versioned and exclusive", () => {
  const registry = new WebRuntimeExtensionRegistry();
  registry.register({ id: "session.test", kind: "session", contractVersion: WEB_EXTENSION_CONTRACT_VERSION });
  registry.register({ id: "access.test", kind: "access-control", contractVersion: WEB_EXTENSION_CONTRACT_VERSION });
  assert.equal(registry.resolve("session")?.id, "session.test");
  assert.throws(
    () => registry.register({ id: "duplicate", kind: "session", contractVersion: WEB_EXTENSION_CONTRACT_VERSION }),
    /already registered/,
  );
});
