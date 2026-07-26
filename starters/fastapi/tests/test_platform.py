import asyncio
import logging
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.config import RuntimeSettings
from app.main import continue_trace
from app.platform import (
    API_EXTENSION_CONTRACT_VERSION,
    TELEMETRY_CONTRACT_VERSION,
    DiagnosticStatus,
    ExtensionPoint,
    RequestMeasurement,
    RuntimeDiagnostics,
    RuntimeExtensionRegistry,
    RuntimeLifecycle,
    RuntimeTelemetry,
    TechnicalAudit,
)


def test_continues_w3c_trace_with_a_new_span() -> None:
    parent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
    trace_id, continued = continue_trace(parent)
    assert trace_id == "4bf92f3577b34da6a3ce929d0e0e4736"
    assert continued.startswith(f"00-{trace_id}-")
    assert "00f067aa0ba902b7" not in continued


def test_extension_registry_is_versioned_and_exclusive() -> None:
    registry = RuntimeExtensionRegistry()
    provider = object()
    registry.register(ExtensionPoint.AUTHENTICATION, provider, API_EXTENSION_CONTRACT_VERSION)
    assert registry.resolve(ExtensionPoint.AUTHENTICATION) is provider
    with pytest.raises(ValueError):
        registry.register(ExtensionPoint.AUTHENTICATION, object(), API_EXTENSION_CONTRACT_VERSION)
    with pytest.raises(ValueError):
        RuntimeExtensionRegistry().register(ExtensionPoint.EVENTS, object(), "api-extension/1.0.0")


def test_diagnostics_are_sorted_and_sanitized() -> None:
    diagnostics = RuntimeDiagnostics()

    async def ok() -> DiagnosticStatus:
        return DiagnosticStatus.OK

    async def failure() -> DiagnosticStatus:
        raise RuntimeError("postgresql://secret")

    diagnostics.register("storage", ok)
    diagnostics.register("cache", failure)
    snapshot = asyncio.run(diagnostics.snapshot())
    assert snapshot["status"] == "degraded"
    assert snapshot["checks"] == {"cache": "degraded", "storage": "ok"}
    assert "secret" not in str(snapshot)


def test_lifecycle_stops_hooks_once_in_reverse_order() -> None:
    lifecycle = RuntimeLifecycle()
    calls: list[str] = []

    async def first() -> None:
        calls.append("first")

    async def second() -> None:
        calls.append("second")

    lifecycle.on_shutdown(first)
    lifecycle.on_shutdown(second)
    asyncio.run(lifecycle.start())
    asyncio.run(lifecycle.stop())
    asyncio.run(lifecycle.stop())
    assert calls == ["second", "first"]


def test_configuration_is_typed_and_rejects_invalid_values() -> None:
    with pytest.raises(ValidationError):
        RuntimeSettings(rate_limit_per_minute=0)


def test_technical_audit_emits_structured_context_without_payload(
    caplog: pytest.LogCaptureFixture,
) -> None:
    with caplog.at_level(logging.INFO, logger="enistere.audit"):
        TechnicalAudit().record(
            "configuration.changed",
            actor="operator-42",
            request_id="runtime-proof-1234",
        )
    event = caplog.records[-1].message
    assert '"event":"configuration.changed"' in event
    assert '"actor":"operator-42"' in event
    assert "password" not in event


def test_opentelemetry_hook_is_versioned_and_export_failures_are_best_effort() -> None:
    class FailingExporter:
        contract_version = TELEMETRY_CONTRACT_VERSION

        async def export_request(self, _: RequestMeasurement) -> None:
            raise RuntimeError("collector unavailable")

    telemetry = RuntimeTelemetry()
    telemetry.register_exporter(FailingExporter())
    measurement = RequestMeasurement("GET", "/health", 503, 2.5, "trace")
    asyncio.run(telemetry.record(measurement))
    assert telemetry.requests == 1
    assert telemetry.errors == 1

    with pytest.raises(ValueError):
        telemetry.register_exporter(FailingExporter())


def test_requirements_lock_covers_every_direct_dependency() -> None:
    root = Path(__file__).parents[1]
    direct = {
        line.partition("==")[0].lower()
        for line in (root / "requirements.txt").read_text().splitlines()
        if line and not line.startswith("#")
    }
    locked = {
        line.partition("==")[0].lower()
        for line in (root / "requirements.lock").read_text().splitlines()
        if line and not line.startswith("#")
    }
    assert direct <= locked
    runtime_locked = {
        line.partition("==")[0].lower()
        for line in (root / "requirements.runtime.lock").read_text().splitlines()
        if line and not line.startswith("#")
    }
    assert runtime_locked <= locked
    assert {"fastapi", "uvicorn", "pydantic-settings"} <= runtime_locked
    assert {"pytest", "ruff", "pip-audit"}.isdisjoint(runtime_locked)
