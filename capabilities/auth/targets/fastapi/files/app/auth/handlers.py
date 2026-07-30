from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Request
from fastapi.responses import JSONResponse

from .errors import AuthError


async def auth_error_handler(request: Request, error: Exception) -> JSONResponse:
    """Renders an `AuthError` in the baseline's canonical envelope.

    Composed through `fastapi.exception-handler`. Without it these errors would
    reach the baseline's `Exception` catch-all and be reported as 500: a refused
    credential would look like a broken server, and the client could not tell an
    expired session from an outage. That is not hypothetical — the same defect
    was found and fixed on the Spring authority.

    The envelope is reproduced rather than imported so the capability does not
    reach into a private baseline helper; the shape is the contract, and a
    contract test pins it.
    """
    failure = error if isinstance(error, AuthError) else AuthError(500, "INTERNAL_ERROR", "")
    return JSONResponse(status_code=failure.status_code, content={
        "success": False,
        "statusCode": failure.status_code,
        "errorCode": failure.error_code,
        "message": failure.message,
        "details": None,
        "path": request.url.path,
        "timestamp": datetime.now(UTC).isoformat(),
        "requestId": getattr(request.state, "request_id", None),
    })
