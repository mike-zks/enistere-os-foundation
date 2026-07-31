from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import RefreshToken, User


async def find_active_user_by_email(session: AsyncSession, email: str) -> User | None:
    """Looks up an identity by address, case-insensitively.

    Addresses are compared folded because `Ada@example.test` and
    `ada@example.test` are the same mailbox to every provider that matters, and
    treating them as two identities is how one person ends up with two accounts —
    or, worse, how a second account shadows the first.
    """
    result = await session.execute(select(User).where(User.email == email.strip().lower()))
    return result.scalar_one_or_none()


async def find_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.get(User, user_id)


async def find_refresh_token(session: AsyncSession, fingerprint: str) -> RefreshToken | None:
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == fingerprint),
    )
    return result.scalar_one_or_none()


async def revoke_refresh_token(session: AsyncSession, token: RefreshToken) -> bool:
    """Revokes one session, and reports whether *this* call is the one that did.

    The `revoked_at IS NULL` guard makes the update conditional in the database
    rather than in the process. Two concurrent presentations of the same token
    both read it as live; only one satisfies the guard. That single winner is
    what makes reuse detection a fact rather than a race — without it, both
    callers would believe they rotated legitimately.
    """
    result = await session.execute(
        update(RefreshToken)
        .where(RefreshToken.id == token.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC)),
    )
    return result.rowcount == 1


async def revoke_user_sessions(session: AsyncSession, user_id: uuid.UUID) -> int:
    """Revokes every live session of an identity. Used on reuse detection."""
    result = await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC)),
    )
    return int(result.rowcount)


async def record_login(session: AsyncSession, user: User) -> None:
    await session.execute(
        update(User).where(User.id == user.id).values(last_login_at=datetime.now(UTC)),
    )
