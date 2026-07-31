from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends

from ..auth.router import require_user
from ..auth.service import PublicUser
from . import service

#: A guard, as FastAPI expresses one: a dependency that either returns the
#: principal or raises.
Guard = Callable[..., Awaitable[PublicUser]]


def requires_role(role: str) -> Guard:
    """Guards a route behind a role.

    Authentication is resolved *first*, by depending on `require_user`: an absent
    or unusable session must yield 401, never 403. Answering 403 to an anonymous
    caller would tell it the route exists and that some grant would open it.
    """

    async def guard(user: Annotated[PublicUser, Depends(require_user)]) -> PublicUser:
        await service.require_role(user.id, role)
        return user

    return guard


def requires_permission(permission: str) -> Guard:
    """Guards a route behind a permission. Same ordering, same reason."""

    async def guard(user: Annotated[PublicUser, Depends(require_user)]) -> PublicUser:
        await service.require_permission(user.id, permission)
        return user

    return guard
