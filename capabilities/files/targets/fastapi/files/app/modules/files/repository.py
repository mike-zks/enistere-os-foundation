from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import FileStatus, StoredFile

ACTIVE_STATUSES = (
    FileStatus.PENDING.value,
    FileStatus.UPLOADED.value,
    FileStatus.VALIDATED.value,
    FileStatus.QUARANTINED.value,
)

MAINTENANCE_LOCK_KEY = "files-maintenance"
MAINTENANCE_LOCK_STATEMENT = text("SELECT pg_try_advisory_lock(hashtext(:key)::bigint)")
MAINTENANCE_UNLOCK_STATEMENT = text("SELECT pg_advisory_unlock(hashtext(:key)::bigint)")


async def lock_owner_for_quota(session: AsyncSession, owner_id: uuid.UUID) -> None:
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:key)::bigint)"),
        {"key": f"files-quota:{owner_id}"},
    )


async def active_usage(session: AsyncSession, owner_id: uuid.UUID) -> tuple[int, int]:
    result = await session.execute(
        select(func.count(StoredFile.id), func.coalesce(func.sum(StoredFile.size), 0)).where(
            StoredFile.owner_id == owner_id,
            StoredFile.status.in_(ACTIVE_STATUSES),
        ),
    )
    count, size = result.one()
    return int(count), int(size)


async def find_owned(
    session: AsyncSession,
    file_id: uuid.UUID,
    owner_id: uuid.UUID,
    *,
    include_deleted: bool = False,
) -> StoredFile | None:
    statement = select(StoredFile).where(
        StoredFile.id == file_id,
        StoredFile.owner_id == owner_id,
    )
    if not include_deleted:
        statement = statement.where(StoredFile.status != FileStatus.DELETED.value)
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def find_any(session: AsyncSession, file_id: uuid.UUID) -> StoredFile | None:
    return await session.get(StoredFile, file_id)


async def list_owned(
    session: AsyncSession,
    owner_id: uuid.UUID,
    limit: int,
    offset: int,
) -> tuple[list[StoredFile], int]:
    predicate = (
        StoredFile.owner_id == owner_id,
        StoredFile.status != FileStatus.DELETED.value,
    )
    rows = await session.execute(
        select(StoredFile)
        .where(*predicate)
        .order_by(StoredFile.created_at.desc(), StoredFile.id.desc())
        .limit(limit)
        .offset(offset),
    )
    total = await session.scalar(select(func.count(StoredFile.id)).where(*predicate))
    return list(rows.scalars()), int(total or 0)


async def transition(
    session: AsyncSession,
    file_id: uuid.UUID,
    expected: FileStatus,
    target: FileStatus,
) -> bool:
    result = await session.execute(
        update(StoredFile)
        .where(StoredFile.id == file_id, StoredFile.status == expected.value)
        .values(status=target.value, updated_at=func.now()),
    )
    return result.rowcount == 1


async def finalize(
    session: AsyncSession,
    file_id: uuid.UUID,
    checksum: str,
) -> StoredFile | None:
    result = await session.execute(
        update(StoredFile)
        .where(StoredFile.id == file_id, StoredFile.status == FileStatus.PENDING.value)
        .values(status=FileStatus.VALIDATED.value, checksum=checksum, updated_at=func.now())
        .returning(StoredFile),
    )
    return result.scalar_one_or_none()


async def purge_candidates(
    session: AsyncSession,
    before: datetime,
) -> list[StoredFile]:
    result = await session.execute(
        select(StoredFile)
        .where(
            StoredFile.status == FileStatus.DELETED.value,
            StoredFile.updated_at < before,
        )
        .order_by(StoredFile.updated_at, StoredFile.id),
    )
    return list(result.scalars())
