from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from ...persistence.audit import business_audit
from ...persistence.database import require_database
from . import audit_events, repository
from .errors import forbidden


@dataclass(frozen=True)
class AuthorizationSummary:
    """What the principal is allowed to know about its own grants.

    Codes only, sorted. No identifier, no description, no timestamp: an internal
    id is a handle on a record the caller has no business holding, and a
    description is documentation, not authorization.
    """

    roles: list[str]
    permissions: list[str]


async def summary_for(user_id: uuid.UUID) -> AuthorizationSummary:
    async def read(session: AsyncSession) -> AuthorizationSummary:
        return AuthorizationSummary(
            roles=await repository.effective_role_names(session, user_id),
            permissions=await repository.effective_permission_names(session, user_id),
        )

    return await require_database().transaction(read)


async def require_role(user_id: uuid.UUID, role: str) -> None:
    """Refuses unless the principal currently holds `role`.

    Deny-by-default: the question is whether the grant is held, never whether it
    is absent. A lookup that fails for any reason therefore denies.
    """
    async def check(session: AsyncSession) -> bool:
        return await repository.holds_role(session, user_id, role)

    if not await require_database().transaction(check):
        await _record_denial(user_id, "role", role)
        raise forbidden()


async def require_permission(user_id: uuid.UUID, permission: str) -> None:
    """Refuses unless the principal currently holds `permission`."""

    async def check(session: AsyncSession) -> bool:
        return await repository.holds_permission(session, user_id, permission)

    if not await require_database().transaction(check):
        await _record_denial(user_id, "permission", permission)
        raise forbidden()


async def _record_denial(user_id: uuid.UUID, kind: str, code: str) -> None:
    """Records what the response refuses to say.

    The missing grant belongs in the audit trail — an operator investigating a
    refusal needs to know which one — and nowhere near the public response.
    """
    await business_audit.record(
        audit_events.AUTHORIZATION_DENIED,
        user_id=user_id,
        target_type=kind,
        target_id=code,
    )
