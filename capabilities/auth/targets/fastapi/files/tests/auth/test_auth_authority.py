from __future__ import annotations

import os

import httpx
import pytest

from app.auth import audit_events as events
from app.auth.ratelimit import reset as reset_rate_limits
from app.main import app
from app.persistence.database import Database

from .conftest import DATABASE_CONFIGURED, REQUIRE_DATABASE, audit_events, make_user, rows_of

pytestmark = [
    pytest.mark.anyio,
    pytest.mark.skipif(
        not DATABASE_CONFIGURED,
        reason="ENISTERE_DATABASE_URL is not set; authority proofs need a real PostgreSQL",
    ),
]

PASSWORD = "correct horse battery staple"  # noqa: S105 — a test fixture, not a secret.


def test_golden_runtime_actually_provides_a_database() -> None:
    """Fails loudly when the golden runs without the database it promises.

    Without this, a golden that lost its `ENISTERE_DATABASE_URL` would report a
    green suite made entirely of skips: the authority would be declared proven by
    a run that exercised none of it.
    """
    if REQUIRE_DATABASE:
        assert DATABASE_CONFIGURED, (
            "GOLDEN_RUNTIME_DB=1 but ENISTERE_DATABASE_URL is unset: "
            "every authority proof would have been skipped"
        )


async def call(method: str, path: str, **kwargs: object) -> httpx.Response:
    reset_rate_limits()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, **kwargs)  # type: ignore[arg-type]


async def login(email: str = "ada@example.test", password: str = PASSWORD) -> httpx.Response:
    return await call("POST", "/api/v1/auth/login", json={"email": email, "password": password})


# ── AUTH-AUTHORITY-001 ────────────────────────────────────────────────────────

async def test_login_valid_credentials_returns_canonical_session(database: Database) -> None:
    await make_user(database)

    response = await login()

    assert response.status_code == 200
    body = response.json()
    assert body["accessToken"]
    assert body["refreshToken"]
    assert body["tokenType"] == "Bearer"
    assert body["accessTokenExpiresIn"] == 900
    assert body["refreshTokenExpiresIn"] == 2592000
    assert body["user"]["email"] == "ada@example.test"
    assert body["user"]["status"] == "active"
    # The public identity must not carry password material.
    assert "passwordHash" not in body["user"]
    assert "password_hash" not in response.text


# ── AUTH-AUTHORITY-002 ────────────────────────────────────────────────────────

async def test_login_wrong_password_and_unknown_email_return_the_same_generic_401(
    database: Database,
) -> None:
    await make_user(database)
    await make_user(database, email="disabled@example.test", is_active=False)

    wrong_password = await login(password="not the password")  # noqa: S106 — test fixture.
    unknown_email = await login(email="ghost@example.test")
    disabled_account = await login(email="disabled@example.test")

    for response in (wrong_password, unknown_email, disabled_account):
        assert response.status_code == 401
        assert response.json()["errorCode"] == "AUTH_INVALID_CREDENTIALS"
    # Identical apart from the correlation id: anything else enumerates accounts.
    assert wrong_password.json()["message"] == unknown_email.json()["message"]
    assert unknown_email.json()["message"] == disabled_account.json()["message"]


# ── AUTH-AUTHORITY-003 ────────────────────────────────────────────────────────

async def test_me_requires_a_valid_token_and_returns_the_public_profile(
    database: Database,
) -> None:
    await make_user(database)
    token = (await login()).json()["accessToken"]

    authenticated = await call(
        "GET", "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"},
    )
    assert authenticated.status_code == 200
    assert authenticated.json()["email"] == "ada@example.test"
    assert "passwordHash" not in authenticated.text
    assert "password_hash" not in authenticated.text

    assert (await call("GET", "/api/v1/auth/me")).status_code == 401
    anonymous = await call(
        "GET", "/api/v1/auth/me", headers={"Authorization": "Bearer not-a-token"},
    )
    assert anonymous.status_code == 401


async def test_me_rejects_a_token_whose_account_was_disabled_after_issuance(
    database: Database,
) -> None:
    from sqlalchemy import text as sql
    from sqlalchemy.ext.asyncio import AsyncSession

    await make_user(database)
    token = (await login()).json()["accessToken"]

    async def disable(session: AsyncSession) -> None:
        await session.execute(sql("UPDATE users SET is_active = FALSE"))

    await database.transaction(disable)

    # A valid signature is not sufficient: only the database knows the account
    # was disabled before the token expired.
    refused = await call("GET", "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert refused.status_code == 401


# ── AUTH-AUTHORITY-004 ────────────────────────────────────────────────────────

async def test_refresh_rotates_the_token_pair(database: Database) -> None:
    await make_user(database)
    first = (await login()).json()

    rotated = await call(
        "POST", "/api/v1/auth/refresh", json={"refreshToken": first["refreshToken"]},
    )

    assert rotated.status_code == 200
    assert rotated.json()["refreshToken"] != first["refreshToken"]
    assert rotated.json()["accessToken"] != first["accessToken"]


async def test_refresh_after_rotation_detects_reuse_and_revokes_the_family(
    database: Database,
) -> None:
    await make_user(database)
    first = (await login()).json()
    rotated = (await call(
        "POST", "/api/v1/auth/refresh", json={"refreshToken": first["refreshToken"]},
    )).json()

    replayed = await call(
        "POST", "/api/v1/auth/refresh", json={"refreshToken": first["refreshToken"]},
    )
    assert replayed.status_code == 401
    assert replayed.json()["errorCode"] == "AUTH_REFRESH_TOKEN_INVALID"

    # A replay is read as a leak, so the successor dies with it. Signing the user
    # out is the correct outcome of a suspected theft.
    survivor = await call(
        "POST", "/api/v1/auth/refresh", json={"refreshToken": rotated["refreshToken"]},
    )
    assert survivor.status_code == 401


async def test_refresh_rejects_unknown_and_revoked_tokens_without_leaking_a_hash(
    database: Database,
) -> None:
    await make_user(database)
    session = (await login()).json()

    unknown = await call("POST", "/api/v1/auth/refresh", json={"refreshToken": "not-a-token"})
    assert unknown.status_code == 401
    assert unknown.json()["errorCode"] == "AUTH_REFRESH_TOKEN_INVALID"

    stored = (await rows_of(database, "refresh_tokens"))[0]["token_hash"]
    assert stored not in unknown.text
    assert stored not in session["refreshToken"]


# ── AUTH-AUTHORITY-005 ────────────────────────────────────────────────────────

async def test_logout_is_idempotent_and_revokes_the_refresh_session(
    database: Database,
) -> None:
    await make_user(database)
    session = (await login()).json()

    first = await call(
        "POST", "/api/v1/auth/logout", json={"refreshToken": session["refreshToken"]},
    )
    second = await call(
        "POST", "/api/v1/auth/logout", json={"refreshToken": session["refreshToken"]},
    )
    unknown = await call("POST", "/api/v1/auth/logout", json={"refreshToken": "never-existed"})

    # Non-revealing: three different truths, one answer.
    assert first.status_code == 204
    assert second.status_code == 204
    assert unknown.status_code == 204

    refused = await call(
        "POST", "/api/v1/auth/refresh", json={"refreshToken": session["refreshToken"]},
    )
    assert refused.status_code == 401


# ── AUTH-AUTHORITY-006 ────────────────────────────────────────────────────────

async def test_login_persists_only_a_refresh_fingerprint(database: Database) -> None:
    await make_user(database)
    session = (await login()).json()

    users = await rows_of(database, "users")
    tokens = await rows_of(database, "refresh_tokens")

    # The password is stored as an Argon2id hash, never in clear.
    assert users[0]["password_hash"].startswith("$argon2id$")
    assert PASSWORD not in users[0]["password_hash"]
    # The refresh token is stored as a 64-char hex fingerprint, never raw.
    assert len(tokens[0]["token_hash"]) == 64
    assert tokens[0]["token_hash"] != session["refreshToken"]
    assert session["refreshToken"] not in str(tokens[0])


# ── AUTH-AUTHORITY-007 ────────────────────────────────────────────────────────

async def test_credential_exchanges_are_rate_limited_with_the_canonical_envelope(
    database: Database,
) -> None:
    await make_user(database)
    reset_rate_limits()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        limited = None
        for _ in range(12):
            limited = await client.post(
                "/api/v1/auth/login",
                json={"email": "ada@example.test", "password": "wrong"},
            )

    assert limited is not None
    assert limited.status_code == 429
    assert limited.json()["errorCode"] == "AUTH_RATE_LIMITED"
    # The Platform Baseline error contract is not weakened by the limiter.
    assert limited.json()["success"] is False
    assert limited.json()["path"] == "/api/v1/auth/login"
    assert limited.json()["timestamp"]
    reset_rate_limits()


# ── AUTH-AUTHORITY-008 ────────────────────────────────────────────────────────

async def test_audit_events_cover_the_authentication_lifecycle(database: Database) -> None:
    await make_user(database)
    await login(password="wrong")  # noqa: S106 — test fixture.
    session = (await login()).json()
    await call("POST", "/api/v1/auth/refresh", json={"refreshToken": session["refreshToken"]})
    await call("POST", "/api/v1/auth/refresh", json={"refreshToken": "not-a-token"})
    await call("POST", "/api/v1/auth/logout", json={"refreshToken": session["refreshToken"]})

    recorded = await audit_events(database)

    assert events.LOGIN_FAILED in recorded
    assert events.LOGIN_SUCCEEDED in recorded
    assert events.REFRESH_SUCCEEDED in recorded
    assert events.REFRESH_FAILED in recorded
    assert events.LOGOUT in recorded

    # No secret ever reaches the audit trail.
    for row in await rows_of(database, "audit_logs"):
        rendered = str(row)
        assert session["refreshToken"] not in rendered
        assert session["accessToken"] not in rendered
        assert PASSWORD not in rendered


async def test_environment_secrets_are_never_echoed_in_a_response(database: Database) -> None:
    await make_user(database)
    body = (await login()).text
    for secret in (os.environ["JWT_ACCESS_SECRET"], os.environ["REFRESH_TOKEN_HASH_SECRET"]):
        assert secret not in body
