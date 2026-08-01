from datetime import UTC, datetime

from fastapi import Request
from fastapi.responses import JSONResponse

from .errors import FilesError


async def files_error_handler(request: Request, error: Exception) -> JSONResponse:
    failure = error if isinstance(error, FilesError) else FilesError(500, "INTERNAL_ERROR", "")
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
