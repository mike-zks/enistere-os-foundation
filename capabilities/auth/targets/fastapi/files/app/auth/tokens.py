from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt

from .config import auth_settings

ACCESS_TOKEN_TYPE = "access"  # noqa: S105 — a claim name, not a credential.
TOKEN_TYPE = "Bearer"  # noqa: S105 — the HTTP scheme.


@dataclass(frozen=True)
class IssuedRefreshToken:
    """A refresh token and the fingerprint that will be persisted in its place."""

    token: str
    fingerprint: str
    expires_at: datetime


def issue_access_token(user_id: uuid.UUID) -> str:
    settings = auth_settings()
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": ACCESS_TOKEN_TYPE,
            "iss": settings.jwt_issuer,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=settings.access_token_ttl_seconds)).timestamp()),
            # A distinct id per token, so a future revocation list has something
            # to name and two tokens minted in the same second are not equal.
            "jti": secrets.token_hex(16),
        },
        settings.jwt_access_secret,
        algorithm="HS256",
    )


def read_access_token(token: str) -> uuid.UUID | None:
    """Returns the subject of a valid access token, or `None`.

    The algorithm is pinned. Accepting whatever the header announces is what lets
    a caller present an `alg: none` token, or sign an HS256 token with a public
    RSA key the server published.
    """
    settings = auth_settings()
    try:
        claims = jwt.decode(
            token,
            settings.jwt_access_secret,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "iat", "sub", "iss"]},
        )
    except jwt.PyJWTError:
        return None
    if claims.get("type") != ACCESS_TOKEN_TYPE:
        return None
    try:
        return uuid.UUID(str(claims["sub"]))
    except (KeyError, ValueError):
        return None


def issue_refresh_token() -> IssuedRefreshToken:
    """Mints an opaque refresh token and its fingerprint.

    Opaque rather than a JWT: a refresh token is only ever presented back to this
    service, so it carries no claims worth reading. Being opaque, it cannot be
    accepted on the strength of a signature alone — every use is a database
    lookup, which is what makes revocation and reuse detection possible at all.
    """
    settings = auth_settings()
    token = secrets.token_urlsafe(48)
    return IssuedRefreshToken(
        token=token,
        fingerprint=fingerprint_refresh_token(token),
        expires_at=datetime.now(UTC) + timedelta(seconds=settings.refresh_token_ttl_seconds),
    )


def fingerprint_refresh_token(token: str) -> str:
    """SHA-256 HMAC of the token, hex encoded.

    Keyed rather than a bare digest: a bare SHA-256 of a high-entropy token is
    already impractical to invert, but the key means a stolen database cannot be
    matched against fingerprints computed offline without also stealing the
    secret.
    """
    return hmac.new(
        auth_settings().refresh_token_hash_secret.encode("utf-8"),
        token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
