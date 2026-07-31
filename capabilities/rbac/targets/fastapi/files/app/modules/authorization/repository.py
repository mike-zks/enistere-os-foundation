from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Permission, Role, role_permissions, user_roles


async def effective_role_names(session: AsyncSession, user_id: uuid.UUID) -> list[str]:
    """Role codes currently granted to `user_id`, sorted.

    Read at request time, never cached and never carried in a token: a grant
    revoked a second ago must be gone on the next request, not on the next login.
    """
    result = await session.execute(
        select(Role.name)
        .join(user_roles, user_roles.c.role_id == Role.id)
        .where(user_roles.c.user_id == user_id)
        .order_by(Role.name),
    )
    return list(result.scalars())


async def effective_permission_names(session: AsyncSession, user_id: uuid.UUID) -> list[str]:
    """Permission codes reachable through the user's roles, sorted and deduplicated.

    `DISTINCT` because two roles may grant the same permission; the caller is
    entitled to know it holds it, not how many paths lead to it.
    """
    result = await session.execute(
        select(Permission.name)
        .distinct()
        .join(role_permissions, role_permissions.c.permission_id == Permission.id)
        .join(user_roles, user_roles.c.role_id == role_permissions.c.role_id)
        .where(user_roles.c.user_id == user_id)
        .order_by(Permission.name),
    )
    return list(result.scalars())


async def holds_role(session: AsyncSession, user_id: uuid.UUID, role: str) -> bool:
    result = await session.execute(
        select(Role.id)
        .join(user_roles, user_roles.c.role_id == Role.id)
        .where(user_roles.c.user_id == user_id, Role.name == role)
        .limit(1),
    )
    return result.scalar_one_or_none() is not None


async def holds_permission(session: AsyncSession, user_id: uuid.UUID, permission: str) -> bool:
    result = await session.execute(
        select(Permission.id)
        .join(role_permissions, role_permissions.c.permission_id == Permission.id)
        .join(user_roles, user_roles.c.role_id == role_permissions.c.role_id)
        .where(user_roles.c.user_id == user_id, Permission.name == permission)
        .limit(1),
    )
    return result.scalar_one_or_none() is not None
