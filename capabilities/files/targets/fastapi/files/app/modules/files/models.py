from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from ...persistence.database import Base


class FileStatus(StrEnum):
    PENDING = "PENDING"
    UPLOADED = "UPLOADED"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    QUARANTINED = "QUARANTINED"
    DELETED = "DELETED"


class FileCategory(StrEnum):
    IMAGE = "IMAGE"
    DOCUMENT = "DOCUMENT"
    AVATAR = "AVATAR"
    MEDIA = "MEDIA"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"
    IDENTITY_DOCUMENT = "IDENTITY_DOCUMENT"
    ATTACHMENT = "ATTACHMENT"
    OTHER = "OTHER"


class StoredFile(Base):
    __tablename__ = "stored_files"
    __table_args__ = (
        CheckConstraint("size > 0", name="ck_stored_files_size_positive"),
        Index("idx_stored_files_owner_id", "owner_id"),
        Index("idx_stored_files_status", "status"),
        Index("idx_stored_files_owner_page", "owner_id", "created_at", "id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    bucket: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(127), nullable=False)
    extension: Mapped[str] = mapped_column(String(20), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    subject_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now(),
    )
