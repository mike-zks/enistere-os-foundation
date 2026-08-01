from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Request, Response, UploadFile
from pydantic import BaseModel, Field

from ..auth.service import PublicUser
from ..authorization.dependencies import requires_permission
from . import service
from .config import files_settings
from .models import FileCategory
from .service import PublicStoredFile

router = APIRouter(prefix="/api/v1/files", tags=["files"])


class StoredFileResponse(BaseModel):
    id: uuid.UUID
    original_name: str = Field(serialization_alias="originalName")
    mime_type: str = Field(serialization_alias="mimeType")
    size: int
    category: str
    status: str
    subject_id: str | None = Field(serialization_alias="subjectId")
    created_at: datetime = Field(serialization_alias="createdAt")

    @classmethod
    def of(cls, file: PublicStoredFile) -> StoredFileResponse:
        return cls(**vars(file))


class FileListResponse(BaseModel):
    items: list[StoredFileResponse]
    next_offset: int | None = Field(serialization_alias="nextOffset")
    total: int


class DownloadUrlResponse(BaseModel):
    url: str
    expires_in: int = Field(serialization_alias="expiresIn")


def _context(request: Request) -> service.RequestContext:
    return service.RequestContext(
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post(
    "/upload",
    status_code=201,
    response_model=StoredFileResponse,
    response_model_by_alias=True,
)
async def upload(
    request: Request,
    user: Annotated[PublicUser, Depends(requires_permission("files.upload"))],
    file: Annotated[UploadFile, File()],
    category: Annotated[FileCategory, Form()],
    subject_id: Annotated[str | None, Form(alias="subjectId", max_length=128)] = None,
) -> StoredFileResponse:
    content = await file.read(files_settings().max_size_bytes + 1)
    try:
        stored = await service.upload(
            user.id, content, file.filename, category, subject_id, _context(request),
        )
    finally:
        await file.close()
    return StoredFileResponse.of(stored)


@router.get("", response_model=FileListResponse, response_model_by_alias=True)
async def list_files(
    response: Response,
    user: Annotated[PublicUser, Depends(requires_permission("files.read"))],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> FileListResponse:
    response.headers["Cache-Control"] = "no-store"
    page = await service.list_owned(user.id, limit, offset)
    return FileListResponse(
        items=[StoredFileResponse.of(item) for item in page.items],
        next_offset=page.next_offset,
        total=page.total,
    )


@router.get("/{file_id}", response_model=StoredFileResponse, response_model_by_alias=True)
async def metadata(
    request: Request,
    response: Response,
    file_id: uuid.UUID,
    user: Annotated[PublicUser, Depends(requires_permission("files.read"))],
) -> StoredFileResponse:
    response.headers["Cache-Control"] = "no-store"
    return StoredFileResponse.of(await service.metadata(file_id, user.id, _context(request)))


@router.post(
    "/{file_id}/download-url",
    response_model=DownloadUrlResponse,
    response_model_by_alias=True,
)
async def download_url(
    request: Request,
    response: Response,
    file_id: uuid.UUID,
    user: Annotated[PublicUser, Depends(requires_permission("files.download"))],
) -> DownloadUrlResponse:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    response.headers["Referrer-Policy"] = "no-referrer"
    grant = await service.issue_download_url(file_id, user.id, _context(request))
    return DownloadUrlResponse(url=grant.url, expires_in=grant.expires_in)


@router.delete("/{file_id}", status_code=204)
async def delete(
    request: Request,
    file_id: uuid.UUID,
    user: Annotated[PublicUser, Depends(requires_permission("files.delete"))],
) -> None:
    await service.delete(file_id, user.id, _context(request))


@router.post("/{file_id}/quarantine", status_code=204)
async def quarantine(
    request: Request,
    file_id: uuid.UUID,
    user: Annotated[PublicUser, Depends(requires_permission("files.quarantine"))],
) -> None:
    await service.quarantine(file_id, user.id, _context(request))


@router.post("/{file_id}/restore", status_code=204)
async def restore(
    request: Request,
    file_id: uuid.UUID,
    user: Annotated[PublicUser, Depends(requires_permission("files.restore"))],
) -> None:
    await service.restore(file_id, user.id, _context(request))
