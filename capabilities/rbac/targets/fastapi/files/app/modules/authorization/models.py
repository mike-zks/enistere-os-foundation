from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from ...persistence.database import Base

#: Join tables, declared as plain tables rather than models: they carry no
#: attribute of their own, and giving them an identity would invite code to
#: manipulate an assignment as if it were a thing rather than a relation.
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", PgUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
           primary_key=True),
    Column("role_id", PgUUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"),
           primary_key=True),
    Index("idx_user_roles_user_id", "user_id"),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", PgUUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"),
           primary_key=True),
    Column("permission_id", PgUUID(as_uuid=True),
           ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    Index("idx_role_permissions_role_id", "role_id"),
)


class Role(Base):
    """A named grant bundle. Nothing is seeded — roles are a product decision."""

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now(),
    )


class Permission(Base):
    """An atomic capability code, granted through roles rather than directly."""

    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now(),
    )
