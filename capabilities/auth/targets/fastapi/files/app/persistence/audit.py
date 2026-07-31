from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base, require_database


class AuditLog(Base):
    """Generic business audit sink.

    Generic and without a foreign key, exactly like the table the NestJS and
    Spring baselines ship: the infrastructure imposes no event registry, and each
    composed capability declares its own stable SCREAMING_SNAKE_CASE identifiers.

    It lives here rather than in `app.modules.auth` because it is a *baseline* concern on
    the two other API runtimes. FastAPI's baseline could not create it without
    choosing a data provider, so the persistence primitive supplies it — and the
    day the baseline picks one, this table moves with the package.
    """

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_event_type", "event_type"),
        Index("idx_audit_logs_user_id", "user_id"),
        Index("idx_audit_logs_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    target_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )


class BusinessAudit:
    """Records business events. Best-effort by contract, never by accident.

    Each entry is committed in its **own** transaction, so an audit write neither
    joins nor rolls back the caller's work — the same independence
    `REQUIRES_NEW` gives the Spring implementation. A failure is logged and
    swallowed: losing an audit line must not turn a successful login into a 500,
    and the operator still sees the loss.

    Metadata is limited to non-sensitive primitives. Tokens, hashes, passwords
    and full payloads never reach this method, which is why it takes named
    arguments rather than an open mapping.
    """

    def __init__(self) -> None:
        self._logger = logging.getLogger("enistere.audit.business")

    async def record(
        self,
        event_type: str,
        *,
        user_id: uuid.UUID | None = None,
        target_type: str | None = None,
        target_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        entry = AuditLog(
            event_type=event_type,
            user_id=user_id,
            target_type=target_type,
            target_id=_truncate(target_id, 255),
            ip_address=_truncate(ip_address, 45),
            user_agent=_truncate(user_agent, 512),
            created_at=datetime.now(UTC),
        )
        async def write(session: AsyncSession) -> None:
            session.add(entry)

        try:
            await require_database().transaction(write)
        except Exception:
            self._logger.error(
                "audit.record.failed event=%s userId=%s", event_type, user_id,
            )


def _truncate(value: str | None, maximum: int) -> str | None:
    if value is None:
        return None
    return value[:maximum]


business_audit = BusinessAudit()
