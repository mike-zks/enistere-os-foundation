from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from ...persistence.audit import business_audit
from ...persistence.database import require_database
from . import audit_events, repository
from .config import auth_settings
from .errors import invalid_credentials, invalid_refresh_token, unauthenticated
from .models import RefreshToken, User
from .passwords import verify_password, waste_verification_time
from .tokens import (
    TOKEN_TYPE,
    fingerprint_refresh_token,
    issue_access_token,
    issue_refresh_token,
    read_access_token,
)


@dataclass(frozen=True)
class PublicUser:
    id: uuid.UUID
    email: str
    status: str

    @classmethod
    def of(cls, user: User) -> PublicUser:
        return cls(id=user.id, email=user.email, status="active" if user.is_active else "disabled")


@dataclass(frozen=True)
class Session:
    """The canonical Authentication session (ADR-068).

    Identical in shape to what NestJS and Spring return: both lifetimes are
    explicit and the public identity travels with the session, so a client never
    has to call `/me` just to render who is signed in.
    """

    user: PublicUser
    access_token: str
    refresh_token: str
    token_type: str
    access_token_expires_in: int
    refresh_token_expires_in: int


class _ReuseDetected(Exception):
    """A refresh token presented twice. Internal: the caller sees the generic error.

    Carries the identity so the family can be revoked outside the transaction
    that detected the replay.
    """

    def __init__(self, user_id: uuid.UUID) -> None:
        super().__init__("refresh token reuse detected")
        self.user_id = user_id


@dataclass(frozen=True)
class RequestContext:
    """Non-sensitive request metadata, for the audit trail only."""

    ip_address: str | None = None
    user_agent: str | None = None


async def login(email: str, password: str, context: RequestContext) -> Session:
    """Exchanges credentials for a session.

    Every failure — unknown address, wrong password, disabled account — raises
    the *same* error. Distinguishing them would turn the endpoint into an account
    enumerator, which is precisely what the coarse code exists to prevent.
    """

    async def authenticate(session: AsyncSession) -> tuple[User, Session]:
        user = await repository.find_active_user_by_email(session, email)
        if user is None:
            # Spend the time a real verification would have cost, so the clock
            # does not answer the question the response body refuses to.
            waste_verification_time()
            raise invalid_credentials()
        if not user.is_active or not verify_password(password, user.password_hash):
            raise invalid_credentials()
        await repository.record_login(session, user)
        return user, _open_session(session, user)

    try:
        user, issued = await require_database().transaction(authenticate)
    except Exception:
        await business_audit.record(
            audit_events.LOGIN_FAILED,
            target_type="email",
            target_id=email.strip().lower(),
            ip_address=context.ip_address,
            user_agent=context.user_agent,
        )
        raise

    await business_audit.record(
        audit_events.LOGIN_SUCCEEDED,
        user_id=user.id,
        ip_address=context.ip_address,
        user_agent=context.user_agent,
    )
    return issued


async def refresh(raw_token: str, context: RequestContext) -> Session:
    """Rotates a refresh session, and treats a replay as a compromise.

    Revocation of the presented token and issuance of its successor happen in one
    transaction: a failure in between would otherwise revoke a live session and
    hand back nothing, signing the user out for an internal reason.

    If the revocation does not take — because a concurrent call already spent
    it — the token is being replayed, and the honest reading is that it leaked.
    The whole family is revoked and the caller refused. Signing the user out is
    the correct outcome of a suspected theft, not a defect.
    """
    fingerprint = fingerprint_refresh_token(raw_token)
    database = require_database()

    async def rotate(session: AsyncSession) -> tuple[User, Session]:
        stored = await repository.find_refresh_token(session, fingerprint)
        # Unknown or expired is not a replay: nobody is presenting a credential
        # the authority ever considered live.
        if stored is None or _is_expired(stored):
            raise invalid_refresh_token()
        # Already revoked, on the other hand, means this exact token was spent
        # before — and something still holds a copy of it.
        if stored.revoked_at is not None:
            raise _ReuseDetected(stored.user_id)
        if not await repository.revoke_refresh_token(session, stored):
            # Lost the conditional update to a concurrent call: same conclusion,
            # reached through the race rather than through the stored state.
            raise _ReuseDetected(stored.user_id)
        user = await repository.find_user_by_id(session, stored.user_id)
        if user is None or not user.is_active:
            raise invalid_refresh_token()
        return user, _open_session(session, user)

    try:
        user, issued = await database.transaction(rotate)
    except _ReuseDetected as reuse:
        # Bound before the closure: Python unbinds an `except ... as` name when
        # the block ends, so a closure that reads it is one refactor away from
        # a NameError.
        compromised = reuse.user_id

        # In its OWN transaction, deliberately. Revoking inside the one that is
        # about to be rolled back would undo the containment along with the
        # refusal — the family would survive the theft that was just detected.
        async def contain(session: AsyncSession) -> None:
            await repository.revoke_user_sessions(session, compromised)

        await database.transaction(contain)
        await business_audit.record(
            audit_events.REFRESH_FAILED,
            user_id=compromised,
            ip_address=context.ip_address,
            user_agent=context.user_agent,
        )
        raise invalid_refresh_token() from None
    except Exception:
        await business_audit.record(
            audit_events.REFRESH_FAILED,
            ip_address=context.ip_address,
            user_agent=context.user_agent,
        )
        raise

    await business_audit.record(
        audit_events.REFRESH_SUCCEEDED,
        user_id=user.id,
        ip_address=context.ip_address,
        user_agent=context.user_agent,
    )
    return issued


async def logout(raw_token: str, context: RequestContext) -> None:
    """Revokes a session. Idempotent, and non-revealing.

    An unknown, expired or already-revoked token answers exactly like a
    successful revocation: the caller learns nothing about which tokens exist,
    and a client that lost track of its own state can always sign out.
    """
    fingerprint = fingerprint_refresh_token(raw_token)

    async def revoke(session: AsyncSession) -> uuid.UUID | None:
        stored = await repository.find_refresh_token(session, fingerprint)
        if stored is None:
            return None
        await repository.revoke_refresh_token(session, stored)
        return stored.user_id

    user_id = await require_database().transaction(revoke)
    await business_audit.record(
        audit_events.LOGOUT,
        user_id=user_id,
        ip_address=context.ip_address,
        user_agent=context.user_agent,
    )


async def current_user(access_token: str) -> PublicUser:
    """Resolves the identity behind an access token, or refuses.

    The signature is checked first, but it is not sufficient: an account
    deactivated after the token was minted must stop being accepted before that
    token expires, and only the database knows that.
    """
    user_id = read_access_token(access_token)
    if user_id is None:
        raise unauthenticated()

    async def load(session: AsyncSession) -> User:
        user = await repository.find_user_by_id(session, user_id)
        if user is None or not user.is_active:
            raise unauthenticated()
        return user

    return PublicUser.of(await require_database().transaction(load))


def _open_session(session: AsyncSession, user: User) -> Session:
    """Mints a session and stages its refresh fingerprint in the caller's unit of work.

    Synchronous and staging-only on purpose: the row is added to the session the
    caller is already holding, so issuance commits atomically with whatever
    justified it — a successful login, or the revocation it replaces.
    """
    settings = auth_settings()
    refresh_token = issue_refresh_token()
    session.add(RefreshToken(
        user_id=user.id,
        token_hash=refresh_token.fingerprint,
        expires_at=refresh_token.expires_at,
    ))
    return Session(
        user=PublicUser.of(user),
        access_token=issue_access_token(user.id),
        refresh_token=refresh_token.token,
        token_type=TOKEN_TYPE,
        access_token_expires_in=settings.access_token_ttl_seconds,
        refresh_token_expires_in=settings.refresh_token_ttl_seconds,
    )


def _is_expired(stored: RefreshToken) -> bool:
    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    return expires_at <= datetime.now(UTC)
