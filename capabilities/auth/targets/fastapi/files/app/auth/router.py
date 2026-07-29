from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from . import service
from .config import auth_settings
from .errors import unauthenticated
from .ratelimit import enforce
from .service import PublicUser, RequestContext, Session

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

#: `auto_error=False` so a missing header reaches our handler and produces the
#: canonical envelope, instead of FastAPI's own 403 shape.
bearer_scheme = HTTPBearer(auto_error=False)


#: Shape only, deliberately. `EmailStr` would pull in `email-validator`, which
#: rejects special-use TLDs such as `.test` and `.internal` — addresses the
#: NestJS and Spring authorities accept. Three runtimes of one family must not
#: disagree on who is allowed to exist: a user could then register against one
#: authority and be refused by another.
EMAIL_SHAPE = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255, pattern=EMAIL_SHAPE)
    password: str = Field(min_length=1, max_length=256)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=512, alias="refreshToken")


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=512, alias="refreshToken")


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    status: str


class SessionResponse(BaseModel):
    """Serialised with camelCase aliases, matching the two other authorities."""

    user: UserResponse
    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str = Field(serialization_alias="refreshToken")
    token_type: str = Field(serialization_alias="tokenType")
    access_token_expires_in: int = Field(serialization_alias="accessTokenExpiresIn")
    refresh_token_expires_in: int = Field(serialization_alias="refreshTokenExpiresIn")

    @classmethod
    def of(cls, issued: Session) -> SessionResponse:
        return cls(
            user=UserResponse(**vars(issued.user)),
            access_token=issued.access_token,
            refresh_token=issued.refresh_token,
            token_type=issued.token_type,
            access_token_expires_in=issued.access_token_expires_in,
            refresh_token_expires_in=issued.refresh_token_expires_in,
        )


def _context(request: Request) -> RequestContext:
    return RequestContext(
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


async def require_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> PublicUser:
    """Dependency guarding a route behind a valid access token.

    Exported so any capability composed later can protect its own routes without
    re-implementing token handling — the extension point RBAC and Files will use.
    """
    if credentials is None or not credentials.credentials:
        raise unauthenticated()
    return await service.current_user(credentials.credentials)


@router.post("/login", response_model=SessionResponse, response_model_by_alias=True)
async def login(request: Request, body: LoginRequest) -> SessionResponse:
    enforce("login", _client_key(request), auth_settings().login_rate_limit)
    return SessionResponse.of(
        await service.login(body.email, body.password, _context(request)),
    )


@router.post("/refresh", response_model=SessionResponse, response_model_by_alias=True)
async def refresh(request: Request, body: RefreshRequest) -> SessionResponse:
    enforce("refresh", _client_key(request), auth_settings().refresh_rate_limit)
    return SessionResponse.of(await service.refresh(body.refresh_token, _context(request)))


@router.post("/logout", status_code=204)
async def logout(request: Request, body: LogoutRequest) -> None:
    await service.logout(body.refresh_token, _context(request))


@router.get("/me", response_model=UserResponse)
async def me(user: Annotated[PublicUser, Depends(require_user)]) -> UserResponse:
    return UserResponse(**vars(user))
