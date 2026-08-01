from __future__ import annotations

import hashlib
import uuid
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from ...persistence.audit import business_audit
from ...persistence.database import require_database
from . import audit_events, repository
from .config import files_settings
from .errors import (
    FILE_CONTENT_TYPE_MISMATCH,
    FILE_CONTENT_TYPE_UNDETECTED,
    FILE_FINALIZATION_FAILED,
    FILE_INVALID_EXTENSION,
    FILE_INVALID_NAME,
    FILE_MAINTENANCE_BUSY,
    FILE_NOT_FOUND,
    FILE_QUARANTINE_INVALID_STATUS,
    FILE_RESTORE_INVALID_STATUS,
    FILE_SIZE_EXCEEDED,
    FILE_STORAGE_QUOTA_EXCEEDED,
    FILE_STORAGE_UNAVAILABLE,
    failure,
)
from .models import FileCategory, FileStatus, StoredFile
from .storage import require_storage


@dataclass(frozen=True)
class RequestContext:
    ip_address: str | None
    user_agent: str | None


@dataclass(frozen=True)
class DetectedType:
    mime_type: str
    extension: str


@dataclass(frozen=True)
class PublicStoredFile:
    id: uuid.UUID
    original_name: str
    mime_type: str
    size: int
    category: str
    status: str
    subject_id: str | None
    created_at: datetime


@dataclass(frozen=True)
class FilePage:
    items: list[PublicStoredFile]
    next_offset: int | None
    total: int


@dataclass(frozen=True)
class DownloadGrant:
    url: str
    expires_in: int


@dataclass(frozen=True)
class MaintenanceReport:
    examined: int
    purged: int
    kept_object_present: int


ALLOWED_BY_CATEGORY = {
    FileCategory.IMAGE: {"image/jpeg", "image/png", "image/gif", "image/webp"},
    FileCategory.AVATAR: {"image/jpeg", "image/png", "image/webp"},
    FileCategory.DOCUMENT: {"application/pdf"},
    FileCategory.IDENTITY_DOCUMENT: {"image/jpeg", "image/png", "application/pdf"},
    FileCategory.ATTACHMENT: {
        "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf",
    },
    FileCategory.MEDIA: {"image/jpeg", "image/png", "image/gif", "image/webp"},
    FileCategory.VIDEO: set(),
    FileCategory.AUDIO: set(),
    FileCategory.OTHER: set(),
}

EXTENSIONS = {
    "image/jpeg": {"jpg", "jpeg"},
    "image/png": {"png"},
    "image/gif": {"gif"},
    "image/webp": {"webp"},
    "application/pdf": {"pdf"},
}


def detect_type(content: bytes) -> DetectedType | None:
    if content.startswith(b"\xff\xd8\xff"):
        return DetectedType("image/jpeg", "jpg")
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return DetectedType("image/png", "png")
    if content.startswith((b"GIF87a", b"GIF89a")):
        return DetectedType("image/gif", "gif")
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return DetectedType("image/webp", "webp")
    if content.startswith(b"%PDF-"):
        return DetectedType("application/pdf", "pdf")
    return None


def _public(file: StoredFile) -> PublicStoredFile:
    return PublicStoredFile(
        id=file.id,
        original_name=file.original_name,
        mime_type=file.mime_type,
        size=file.size,
        category=file.category,
        status=file.status,
        subject_id=file.subject_id,
        created_at=file.created_at,
    )


def _normalize_name(name: str | None) -> tuple[str, str]:
    cleaned = "".join(character for character in (name or "") if ord(character) > 31)
    cleaned = cleaned.replace("/", "_").replace("\\", "_").strip()
    if not cleaned or len(cleaned) > 255:
        raise failure(400, FILE_INVALID_NAME, "Invalid file name.")
    dot = cleaned.rfind(".")
    extension = cleaned[dot + 1:].lower() if 0 <= dot < len(cleaned) - 1 else ""
    return cleaned, extension


async def upload(
    owner_id: uuid.UUID,
    content: bytes,
    original_name: str | None,
    category: FileCategory,
    subject_id: str | None,
    context: RequestContext,
) -> PublicStoredFile:
    config = files_settings()
    if not content or len(content) > config.max_size_bytes:
        raise failure(413 if content else 400, FILE_SIZE_EXCEEDED, "File size not allowed.")
    name, declared_extension = _normalize_name(original_name)
    detected = detect_type(content)
    if detected is None:
        raise failure(400, FILE_CONTENT_TYPE_UNDETECTED, "Unrecognized file content.")
    if detected.mime_type not in ALLOWED_BY_CATEGORY[category]:
        raise failure(400, FILE_CONTENT_TYPE_MISMATCH, "File content does not match its category.")
    if declared_extension and declared_extension not in EXTENSIONS[detected.mime_type]:
        raise failure(400, FILE_INVALID_EXTENSION, "File extension does not match its content.")

    stored = StoredFile(
        id=uuid.uuid4(),
        original_name=name,
        storage_key=f"{category.value.lower()}/{uuid.uuid4().hex}.{detected.extension}",
        bucket=config.bucket,
        mime_type=detected.mime_type,
        extension=detected.extension,
        size=len(content),
        checksum=None,
        category=category.value,
        status=FileStatus.PENDING.value,
        owner_id=owner_id,
        subject_id=subject_id,
    )

    async def reserve(session: AsyncSession) -> StoredFile:
        await repository.lock_owner_for_quota(session, owner_id)
        active, used = await repository.active_usage(session, owner_id)
        if (
            config.owner_max_active_files > 0
            and active + 1 > config.owner_max_active_files
        ) or (
            config.owner_max_total_bytes > 0
            and used + len(content) > config.owner_max_total_bytes
        ):
            raise failure(409, FILE_STORAGE_QUOTA_EXCEEDED, "Storage quota exceeded.")
        session.add(stored)
        await session.flush()
        return stored

    try:
        await require_database().transaction(reserve)
    except Exception as error:
        if getattr(error, "error_code", None) == FILE_STORAGE_QUOTA_EXCEEDED:
            await _audit(audit_events.QUOTA_EXCEEDED, owner_id, None, context)
        raise

    storage = require_storage()
    try:
        await storage.put(stored.storage_key, content, detected.mime_type)
    except Exception as error:
        await _transition(stored.id, FileStatus.PENDING, FileStatus.REJECTED)
        await _audit(audit_events.UPLOAD_FAILED, owner_id, stored.id, context)
        raise failure(503, FILE_STORAGE_UNAVAILABLE, "File storage is unavailable.") from error

    checksum = hashlib.sha256(content).hexdigest()

    async def finalize(session: AsyncSession) -> StoredFile | None:
        return await repository.finalize(session, stored.id, checksum)

    try:
        finalized = await require_database().transaction(finalize)
    except Exception:
        finalized = None
    if finalized is None:
        # Compensation is best-effort and must never replace the stable API
        # failure with an adapter or database exception. An unreachable object
        # store leaves a PENDING row for reconciliation rather than claiming a
        # successful upload.
        with suppress(Exception):
            await storage.delete(stored.storage_key)
        with suppress(Exception):
            await _transition(stored.id, FileStatus.PENDING, FileStatus.REJECTED)
        await _audit(audit_events.UPLOAD_FAILED, owner_id, stored.id, context)
        raise failure(500, FILE_FINALIZATION_FAILED, "File could not be finalized.")

    await _audit(audit_events.FILE_UPLOADED, owner_id, finalized.id, context)
    return _public(finalized)


async def list_owned(owner_id: uuid.UUID, limit: int, offset: int) -> FilePage:
    async def read(session: AsyncSession) -> tuple[list[StoredFile], int]:
        return await repository.list_owned(session, owner_id, limit, offset)

    files, total = await require_database().transaction(read)
    next_offset = offset + len(files) if offset + len(files) < total else None
    return FilePage([_public(file) for file in files], next_offset, total)


async def metadata(
    file_id: uuid.UUID,
    owner_id: uuid.UUID,
    context: RequestContext,
) -> PublicStoredFile:
    file = await _owned(file_id, owner_id)
    await _audit(audit_events.METADATA_ACCESSED, owner_id, file_id, context)
    return _public(file)


async def issue_download_url(
    file_id: uuid.UUID,
    owner_id: uuid.UUID,
    context: RequestContext,
) -> DownloadGrant:
    file = await _owned(file_id, owner_id)
    if file.status != FileStatus.VALIDATED.value:
        raise failure(404, FILE_NOT_FOUND, "File not found.")
    try:
        if not await require_storage().exists(file.storage_key):
            await _audit(audit_events.STORAGE_OBJECT_MISSING, owner_id, file_id, context)
            raise failure(503, FILE_STORAGE_UNAVAILABLE, "File storage is unavailable.")
        url = await require_storage().signed_download_url(
            file.storage_key, files_settings().signed_url_ttl_seconds,
        )
    except Exception as error:
        if getattr(error, "error_code", None) == FILE_STORAGE_UNAVAILABLE:
            raise
        raise failure(503, FILE_STORAGE_UNAVAILABLE, "File storage is unavailable.") from error
    await _audit(audit_events.DOWNLOAD_URL_ISSUED, owner_id, file_id, context)
    return DownloadGrant(url, files_settings().signed_url_ttl_seconds)


async def delete(
    file_id: uuid.UUID,
    owner_id: uuid.UUID,
    context: RequestContext,
) -> None:
    await _audit(audit_events.DELETION_REQUESTED, owner_id, file_id, context)

    async def read(session: AsyncSession) -> StoredFile | None:
        return await repository.find_owned(
            session, file_id, owner_id, include_deleted=True,
        )

    file = await require_database().transaction(read)
    if file is None or file.status == FileStatus.DELETED.value:
        return
    try:
        await require_storage().delete(file.storage_key)
    except Exception as error:
        await _audit(audit_events.DELETION_FAILED, owner_id, file_id, context)
        raise failure(503, FILE_STORAGE_UNAVAILABLE, "File storage is unavailable.") from error
    await _audit(audit_events.OBJECT_DELETED, owner_id, file_id, context)
    transitioned = await _transition(file_id, FileStatus(file.status), FileStatus.DELETED)
    if not transitioned:
        # A concurrent delete may already have completed. Any other transition
        # means the object is gone while metadata still advertises it, so fail
        # rather than recording a false successful deletion.
        current = await _owned_including_deleted(file_id, owner_id)
        if current is not None and current.status != FileStatus.DELETED.value:
            await _audit(audit_events.DELETION_FAILED, owner_id, file_id, context)
            raise failure(500, FILE_FINALIZATION_FAILED, "File deletion could not be finalized.")
    await _audit(audit_events.DELETED, owner_id, file_id, context)


async def quarantine(file_id: uuid.UUID, actor_id: uuid.UUID, context: RequestContext) -> None:
    file = await _any(file_id)
    if file.status == FileStatus.QUARANTINED.value:
        return
    if file.status != FileStatus.VALIDATED.value or not await _transition(
        file_id, FileStatus.VALIDATED, FileStatus.QUARANTINED,
    ):
        raise failure(409, FILE_QUARANTINE_INVALID_STATUS, "File cannot be quarantined.")
    await _audit(audit_events.QUARANTINED, actor_id, file_id, context)


async def restore(file_id: uuid.UUID, actor_id: uuid.UUID, context: RequestContext) -> None:
    file = await _any(file_id)
    if file.status == FileStatus.VALIDATED.value:
        return
    if file.status != FileStatus.QUARANTINED.value:
        raise failure(409, FILE_RESTORE_INVALID_STATUS, "File cannot be restored.")
    try:
        exists = await require_storage().exists(file.storage_key)
    except Exception as error:
        raise failure(503, FILE_STORAGE_UNAVAILABLE, "File storage is unavailable.") from error
    if not exists or not file.checksum:
        await _audit(audit_events.STORAGE_OBJECT_MISSING, actor_id, file_id, context)
        raise failure(409, FILE_RESTORE_INVALID_STATUS, "File cannot be restored.")
    if not await _transition(file_id, FileStatus.QUARANTINED, FileStatus.VALIDATED):
        raise failure(409, FILE_RESTORE_INVALID_STATUS, "File cannot be restored.")
    await _audit(audit_events.QUARANTINE_RELEASED, actor_id, file_id, context)


async def purge_deleted() -> MaintenanceReport:
    cutoff = datetime.now(UTC) - timedelta(seconds=files_settings().purge_retention_seconds)
    database = require_database()

    # A session-level advisory lock needs one dedicated PostgreSQL connection,
    # but no database transaction is held while MinIO is queried. The lock is
    # released explicitly before the connection returns to the pool.
    async with database.engine.connect() as lock_connection:
        acquired = await lock_connection.scalar(
            repository.MAINTENANCE_LOCK_STATEMENT,
            {"key": repository.MAINTENANCE_LOCK_KEY},
        )
        await lock_connection.commit()
        if not acquired:
            raise failure(409, FILE_MAINTENANCE_BUSY, "Files maintenance is already running.")
        try:
            async def read(session: AsyncSession) -> list[StoredFile]:
                return await repository.purge_candidates(session, cutoff)

            candidates = await database.transaction(read)
            purged = 0
            kept = 0
            for file in candidates:
                try:
                    exists = await require_storage().exists(file.storage_key)
                except Exception:
                    # An outage is not evidence of absence. Conservatively keep
                    # the row and signal the reconciliation decision.
                    exists = True
                if exists:
                    kept += 1
                    await _audit(
                        audit_events.RECONCILIATION_ACTION,
                        None,
                        file.id,
                        RequestContext(None, None),
                    )
                    continue

                async def remove(session: AsyncSession, file_id: uuid.UUID = file.id) -> bool:
                    candidate = await repository.find_any(session, file_id)
                    if candidate is None or candidate.status != FileStatus.DELETED.value:
                        return False
                    await session.delete(candidate)
                    return True

                if await database.transaction(remove):
                    purged += 1
                    await _audit(
                        audit_events.PURGED,
                        None,
                        file.id,
                        RequestContext(None, None),
                    )
            return MaintenanceReport(len(candidates), purged, kept)
        finally:
            await lock_connection.execute(
                repository.MAINTENANCE_UNLOCK_STATEMENT,
                {"key": repository.MAINTENANCE_LOCK_KEY},
            )
            await lock_connection.commit()


async def _owned(file_id: uuid.UUID, owner_id: uuid.UUID) -> StoredFile:
    async def read(session: AsyncSession) -> StoredFile | None:
        return await repository.find_owned(session, file_id, owner_id)

    file = await require_database().transaction(read)
    if file is None:
        raise failure(404, FILE_NOT_FOUND, "File not found.")
    return file


async def _owned_including_deleted(
    file_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> StoredFile | None:
    async def read(session: AsyncSession) -> StoredFile | None:
        return await repository.find_owned(
            session,
            file_id,
            owner_id,
            include_deleted=True,
        )

    return await require_database().transaction(read)


async def _any(file_id: uuid.UUID) -> StoredFile:
    async def read(session: AsyncSession) -> StoredFile | None:
        return await repository.find_any(session, file_id)

    file = await require_database().transaction(read)
    if file is None:
        raise failure(404, FILE_NOT_FOUND, "File not found.")
    return file


async def _transition(file_id: uuid.UUID, expected: FileStatus, target: FileStatus) -> bool:
    async def write(session: AsyncSession) -> bool:
        return await repository.transition(session, file_id, expected, target)

    return await require_database().transaction(write)


async def _audit(
    event: str,
    actor_id: uuid.UUID | None,
    file_id: uuid.UUID | None,
    context: RequestContext,
) -> None:
    await business_audit.record(
        event,
        user_id=actor_id,
        target_type="file",
        target_id=str(file_id) if file_id else None,
        ip_address=context.ip_address,
        user_agent=context.user_agent,
    )
