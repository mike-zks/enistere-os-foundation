from __future__ import annotations

import json
import logging
import re
import secrets
import time
import uuid
from collections import defaultdict, deque
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .composition.capability_routers import CAPABILITY_ROUTERS
from .config import settings
from .platform import RequestMeasurement, diagnostics, runtime_lifespan, technical_audit, telemetry

SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,128}$")
TRACEPARENT = re.compile(r"^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$")
config = settings()
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("enistere.runtime")
request_windows: dict[str, deque[float]] = defaultdict(deque)

app = FastAPI(title="Enistere FastAPI Core", version="0.1.0", lifespan=runtime_lifespan)
# Routes contributed by the composed capabilities. Registered before the baseline
# middleware is added so every capability route goes through it too: correlation,
# canonical errors and security headers are not opt-in.
for capability_router in CAPABILITY_ROUTERS:
    app.include_router(capability_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(config.cors_allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-Id", "traceparent"],
    expose_headers=["X-Request-Id", "traceparent"],
)


def continue_trace(value: str | None) -> tuple[str, str]:
    match = TRACEPARENT.fullmatch((value or "").lower())
    valid = bool(match and match[1] != "0" * 32 and match[2] != "0" * 16)
    trace_id = match[1] if valid and match else secrets.token_hex(16)
    flags = match[3] if valid and match else "01"
    return trace_id, f"00-{trace_id}-{secrets.token_hex(8)}-{flags}"


@app.middleware("http")
async def platform_baseline(request: Request, call_next: Any) -> JSONResponse:
    started = time.monotonic()
    incoming_id = request.headers.get("x-request-id")
    request_id = (
        incoming_id
        if incoming_id and SAFE_REQUEST_ID.fullmatch(incoming_id)
        else str(uuid.uuid4())
    )
    trace_id, traceparent = continue_trace(request.headers.get("traceparent"))
    request.state.request_id = request_id
    request.state.trace_id = trace_id
    client_key = request.client.host if request.client else "unknown"
    window = request_windows[client_key]
    while window and started - window[0] >= 60:
        window.popleft()
    if len(window) >= config.rate_limit_per_minute:
        response = canonical_error(request, 429, "RATE_LIMITED", "Too many requests.", None)
        technical_audit.record("security.rate_limited", actor=None, request_id=request_id)
    else:
        window.append(started)
        response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    response.headers["traceparent"] = traceparent
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    elapsed = (time.monotonic() - started) * 1000
    await telemetry.record(RequestMeasurement(
        request.method, request.url.path, response.status_code, elapsed, trace_id,
    ))
    logger.info(json.dumps({
        "event": "http.request.completed", "method": request.method,
        "route": request.url.path, "statusCode": response.status_code,
        "durationMs": round(elapsed, 3), "requestId": request_id, "traceId": trace_id,
    }, separators=(",", ":"), sort_keys=True))
    return response


def canonical_error(
    request: Request,
    status: int,
    code: str,
    message: str,
    details: object,
) -> JSONResponse:
    return JSONResponse(status_code=status, content={
        "success": False,
        "statusCode": status,
        "errorCode": code,
        "message": message,
        "details": details,
        "path": request.url.path,
        "timestamp": datetime.now(UTC).isoformat(),
        "requestId": getattr(request.state, "request_id", None),
    })


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
    details = [
        {"field": ".".join(map(str, item["loc"][1:])), "code": item["type"]}
        for item in error.errors()
    ]
    return canonical_error(request, 422, "VALIDATION_ERROR", "Request validation failed.", details)


@app.exception_handler(Exception)
async def unexpected_error(request: Request, _: Exception) -> JSONResponse:
    return canonical_error(request, 500, "INTERNAL_ERROR", "An internal error occurred.", None)


@app.get("/health", operation_id="health_get")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": config.service_name,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/health/live", operation_id="health_live")
async def live() -> dict[str, str]:
    return {"status": "live"}


@app.get("/health/ready", operation_id="health_ready", response_model=None)
async def ready() -> dict[str, object] | JSONResponse:
    snapshot = await diagnostics.snapshot()
    payload = {
        "status": "ready" if snapshot["status"] == "ok" else "degraded",
        "checks": snapshot["checks"],
        "timestamp": snapshot["timestamp"],
    }
    return payload if snapshot["status"] == "ok" else JSONResponse(status_code=503, content=payload)
