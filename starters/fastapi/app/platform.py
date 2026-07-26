from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from typing import Protocol, TypeVar

from fastapi import FastAPI

API_EXTENSION_CONTRACT_VERSION = "api-extension/2.0.0"
TELEMETRY_CONTRACT_VERSION = "opentelemetry-hook/2.0.0"
Result = TypeVar("Result")
Entity = TypeVar("Entity")
Identifier = TypeVar("Identifier")


class PersistencePort(Protocol[Entity, Identifier]):
    async def find_by_id(self, identifier: Identifier) -> Entity | None: ...
    async def save(self, entity: Entity) -> Entity: ...
    async def delete_by_id(self, identifier: Identifier) -> None: ...


class MigrationPort(Protocol):
    async def current_version(self) -> str: ...
    async def migrate(self, target: str | None = None) -> None: ...


class TransactionPort(Protocol):
    async def execute(self, work: Callable[[], Awaitable[Result]]) -> Result: ...


class InputValidationPort(Protocol):
    def validate(self, value: object) -> tuple[dict[str, str], ...]: ...


class ExtensionPoint(StrEnum):
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    FILES = "files"
    EVENTS = "events"


class RuntimeExtensionRegistry:
    def __init__(self) -> None:
        self._providers: dict[ExtensionPoint, object] = {}

    def register(self, point: ExtensionPoint, provider: object, contract_version: str) -> None:
        if contract_version != API_EXTENSION_CONTRACT_VERSION:
            raise ValueError(f"unsupported extension contract: {contract_version}")
        if point in self._providers:
            raise ValueError(f"provider already registered: {point}")
        self._providers[point] = provider

    def resolve(self, point: ExtensionPoint) -> object | None:
        return self._providers.get(point)


class DiagnosticStatus(StrEnum):
    OK = "ok"
    DEGRADED = "degraded"


class RuntimeDiagnostics:
    def __init__(self) -> None:
        self._probes: dict[str, Callable[[], Awaitable[DiagnosticStatus]]] = {}

    def register(self, probe_id: str, probe: Callable[[], Awaitable[DiagnosticStatus]]) -> None:
        if not probe_id.replace("-", "").isalnum() or not probe_id[0].isalpha():
            raise ValueError("invalid diagnostic probe id")
        if probe_id in self._probes:
            raise ValueError("diagnostic probe already registered")
        self._probes[probe_id] = probe

    def unregister(self, probe_id: str) -> None:
        self._probes.pop(probe_id, None)

    async def snapshot(self) -> dict[str, object]:
        checks: dict[str, str] = {}
        for probe_id, probe in sorted(self._probes.items()):
            try:
                checks[probe_id] = (await probe()).value
            except Exception:
                checks[probe_id] = DiagnosticStatus.DEGRADED.value
        state = "degraded" if "degraded" in checks.values() else "ok"
        return {"status": state, "timestamp": datetime.now(UTC).isoformat(), "checks": checks}


@dataclass(frozen=True)
class RequestMeasurement:
    method: str
    route: str
    status_code: int
    duration_ms: float
    trace_id: str


class OpenTelemetryExporter(Protocol):
    contract_version: str
    async def export_request(self, measurement: RequestMeasurement) -> None: ...


class RuntimeTelemetry:
    def __init__(self) -> None:
        self.requests = 0
        self.errors = 0
        self._exporter: OpenTelemetryExporter | None = None

    def register_exporter(self, exporter: OpenTelemetryExporter) -> None:
        if exporter.contract_version != TELEMETRY_CONTRACT_VERSION:
            raise ValueError("unsupported telemetry contract")
        if self._exporter:
            raise ValueError("telemetry exporter already registered")
        self._exporter = exporter

    async def record(self, measurement: RequestMeasurement) -> None:
        self.requests += 1
        self.errors += int(measurement.status_code >= 500)
        if self._exporter:
            try:
                await self._exporter.export_request(measurement)
            except Exception:
                logging.getLogger("enistere.telemetry").warning("telemetry.export.failed")


class TechnicalAudit:
    def __init__(self) -> None:
        self._logger = logging.getLogger("enistere.audit")

    def record(self, event: str, *, actor: str | None, request_id: str) -> None:
        self._logger.info(json.dumps({
            "event": event,
            "actor": actor,
            "requestId": request_id,
            "timestamp": datetime.now(UTC).isoformat(),
        }, separators=(",", ":"), sort_keys=True))


class RuntimeLifecycle:
    def __init__(self) -> None:
        self.state = "created"
        self._shutdown_hooks: list[Callable[[], Awaitable[None]]] = []

    def on_shutdown(self, hook: Callable[[], Awaitable[None]]) -> None:
        self._shutdown_hooks.append(hook)

    async def start(self) -> None:
        self.state = "ready"

    async def stop(self) -> None:
        if self.state == "stopped":
            return
        self.state = "draining"
        for hook in reversed(self._shutdown_hooks):
            await hook()
        self.state = "stopped"


lifecycle = RuntimeLifecycle()
diagnostics = RuntimeDiagnostics()
extensions = RuntimeExtensionRegistry()
telemetry = RuntimeTelemetry()
technical_audit = TechnicalAudit()


@asynccontextmanager
async def runtime_lifespan(_: FastAPI) -> AsyncIterator[None]:
    await lifecycle.start()
    technical_audit.record("runtime.started", actor=None, request_id="lifecycle")
    try:
        yield
    finally:
        technical_audit.record("runtime.stopping", actor=None, request_id="lifecycle")
        await lifecycle.stop()
