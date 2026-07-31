from __future__ import annotations

import os
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

os.environ.setdefault("JWT_ACCESS_SECRET", "fastapi_test_access_secret_32_characters")
os.environ.setdefault("REFRESH_TOKEN_HASH_SECRET", "fastapi_test_fingerprint_secret_32_chars")

from app.modules.authorization.models import (  # noqa: E402 — must follow the secrets above.
    Permission,
    Role,
    role_permissions,
    user_roles,
)

# Reuses the Authentication fixtures rather than re-declaring them: RBAC
# `requires: ["auth"]`, so a project composing one always composes the other, and
# two independent database fixtures would race for the same schema.
from tests.auth.conftest import (  # noqa: E402, F401 — re-exported fixtures.
    DATABASE_CONFIGURED,
    REQUIRE_DATABASE,
    anyio_backend,
    audit_events,
    database,
    make_user,
    rows_of,
)

requires_database = pytest.mark.skipif(
    not DATABASE_CONFIGURED,
    reason="ENISTERE_DATABASE_URL is not set; authority proofs need a real PostgreSQL",
)


async def grant(
    database_,  # noqa: ANN001 — the shared Database fixture.
    user_id: uuid.UUID,
    role: str,
    permissions: tuple[str, ...] = (),
) -> None:
    """Creates a role, attaches permissions to it, and grants it to a user."""

    async def write(session: AsyncSession) -> None:
        role_id = uuid.uuid4()
        session.add(Role(id=role_id, name=role))
        await session.flush()
        await session.execute(user_roles.insert().values(user_id=user_id, role_id=role_id))
        for name in permissions:
            # Reused rather than re-created: permission codes are unique, and two
            # roles granting the same code is the ordinary case the summary has
            # to deduplicate.
            existing = await session.execute(select(Permission).where(Permission.name == name))
            permission = existing.scalar_one_or_none()
            if permission is None:
                permission = Permission(id=uuid.uuid4(), name=name)
                session.add(permission)
                await session.flush()
            await session.execute(
                role_permissions.insert().values(role_id=role_id, permission_id=permission.id),
            )

    await database_.transaction(write)


async def revoke_all(database_, user_id: uuid.UUID) -> None:  # noqa: ANN001
    """Removes every role assignment of a user, leaving the roles themselves."""

    async def write(session: AsyncSession) -> None:
        await session.execute(user_roles.delete().where(user_roles.c.user_id == user_id))

    await database_.transaction(write)
