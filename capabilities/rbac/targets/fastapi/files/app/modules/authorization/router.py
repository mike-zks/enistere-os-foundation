from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.router import require_user
from ..auth.service import PublicUser
from . import service

router = APIRouter(prefix="/api/v1/auth/me/authorization", tags=["authorization"])


class AuthorizationSummaryResponse(BaseModel):
    """Effective codes only — the same shape the two other authorities return."""

    roles: list[str]
    permissions: list[str]


@router.get("", response_model=AuthorizationSummaryResponse)
async def authorization(
    user: Annotated[PublicUser, Depends(require_user)],
) -> AuthorizationSummaryResponse:
    """The current principal's own grants.

    Guarded by authentication only, and deliberately: reading what *you* hold is
    not a privileged act. Requiring a permission to read your own permissions
    would make the first grant unobtainable.
    """
    summary = await service.summary_for(user.id)
    return AuthorizationSummaryResponse(roles=summary.roles, permissions=summary.permissions)
