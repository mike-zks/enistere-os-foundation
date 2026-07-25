import asyncio

import httpx
from fastapi import Request
from fastapi.exceptions import RequestValidationError

from app.main import app, config, ready, request_windows, validation_error
from app.platform import DiagnosticStatus, diagnostics


def test_health_http_contract() -> None:
    async def verify() -> None:
        incoming_trace = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            for path, state in (
                ("/health", "ok"),
                ("/health/live", "live"),
                ("/health/ready", "ready"),
            ):
                response = await client.get(path, headers={
                    "X-Request-Id": "runtime-proof-1234",
                    "traceparent": incoming_trace,
                })
                assert response.status_code == 200
                assert response.json()["status"] == state
                assert response.headers["x-request-id"] == "runtime-proof-1234"
                assert response.headers["traceparent"].startswith(
                    "00-4bf92f3577b34da6a3ce929d0e0e4736-"
                )
                assert "00f067aa0ba902b7" not in response.headers["traceparent"]
                assert response.headers["x-content-type-options"] == "nosniff"

    asyncio.run(verify())


def test_openapi_and_canonical_validation_error() -> None:
    async def verify_openapi() -> None:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            document = (await client.get("/openapi.json")).json()
            assert document["openapi"].startswith("3.")
            response = await client.get("/health", headers={"X-Request-Id": "\r\nunsafe"})
            assert response.status_code == 200
            assert response.headers["x-request-id"] != "\r\nunsafe"

    asyncio.run(verify_openapi())

    request = Request({"type": "http", "method": "POST", "path": "/items", "headers": []})
    request.state.request_id = "runtime-proof-1234"
    error = RequestValidationError([{
        "type": "missing",
        "loc": ("body", "name"),
        "msg": "Field required",
        "input": {},
    }])
    response = asyncio.run(validation_error(request, error))
    assert response.status_code == 422
    assert b'"errorCode":"VALIDATION_ERROR"' in response.body
    assert b'"requestId":"runtime-proof-1234"' in response.body


def test_rate_limit_and_security_headers_are_enforced() -> None:
    async def verify() -> None:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            assert (await client.get("/health")).status_code == 200
            limited = await client.get("/health")
            assert limited.status_code == 429
            assert limited.json()["errorCode"] == "RATE_LIMITED"
            assert limited.headers["x-frame-options"] == "DENY"
            assert limited.headers["referrer-policy"] == "no-referrer"

    previous_limit = config.rate_limit_per_minute
    request_windows.clear()
    config.rate_limit_per_minute = 1
    try:
        asyncio.run(verify())
    finally:
        config.rate_limit_per_minute = previous_limit
        request_windows.clear()


def test_readiness_fails_when_a_registered_diagnostic_is_degraded() -> None:
    async def degraded() -> DiagnosticStatus:
        return DiagnosticStatus.DEGRADED

    diagnostics.register("database", degraded)
    try:
        response = asyncio.run(ready())
        assert response.status_code == 503
        assert b'"status":"degraded"' in response.body
    finally:
        diagnostics.unregister("database")
