from __future__ import annotations

from typing import Annotated

import httpx
import pytest
from fastapi import Depends, FastAPI

from app.auth.errors import AuthError
from app.auth.handlers import auth_error_handler
from app.auth.ratelimit import reset as reset_rate_limits
from app.auth.service import PublicUser
from app.authorization import audit_events as events
from app.authorization import requires_permission, requires_role
from app.main import app
from app.persistence.database import Database

from .conftest import DATABASE_CONFIGURED, audit_events, grant, make_user, revoke_all, rows_of

pytestmark = [
    pytest.mark.anyio,
    pytest.mark.skipif(
        not DATABASE_CONFIGURED,
        reason="ENISTERE_DATABASE_URL is not set; authority proofs need a real PostgreSQL",
    ),
]

PASSWORD = "correct horse battery staple"  # noqa: S105 — a test fixture, not a secret.
SUMMARY = "/api/v1/auth/me/authorization"


async def call(method: str, path: str, target: FastAPI = app, **kwargs: object) -> httpx.Response:
    reset_rate_limits()
    transport = httpx.ASGITransport(app=target)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, **kwargs)  # type: ignore[arg-type]


async def sign_in(email: str = "ada@example.test") -> str:
    response = await call(
        "POST", "/api/v1/auth/login", json={"email": email, "password": PASSWORD},
    )
    return response.json()["accessToken"]


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def guarded_app() -> FastAPI:
    """A minimal application exercising the guards a composed capability uses.

    Built here rather than added to the baseline: the guards are what RBAC
    offers to *other* capabilities, and the proof must exercise that surface
    without the runtime shipping a protected route of its own.
    """
    application = FastAPI()

    @application.get("/needs-role")
    async def needs_role(  # pyright: ignore[reportUnusedFunction]
        user: Annotated[PublicUser, Depends(requires_role("editor"))],
    ) -> dict[str, str]:
        return {"id": str(user.id)}

    @application.get("/needs-permission")
    async def needs_permission(  # pyright: ignore[reportUnusedFunction]
        user: Annotated[PublicUser, Depends(requires_permission("articles.write"))],
    ) -> dict[str, str]:
        return {"id": str(user.id)}

    application.add_exception_handler(AuthError, auth_error_handler)
    return application


# ── RBAC-AUTHORITY-001 ────────────────────────────────────────────────────────

async def test_a_revoked_grant_takes_effect_on_the_same_access_token(
    database: Database,
) -> None:
    user_id = await make_user(database)
    await grant(database, user_id, "editor", ("articles.write",))
    token = await sign_in()
    guarded = guarded_app()

    allowed = await call("GET", "/needs-role", guarded, headers=bearer(token))
    assert allowed.status_code == 200

    await revoke_all(database, user_id)

    # Same token, no re-login: the decision is read from current grants, so a
    # revocation cannot wait for the token to expire.
    refused = await call("GET", "/needs-role", guarded, headers=bearer(token))
    assert refused.status_code == 403


async def test_a_new_grant_takes_effect_on_the_same_access_token(database: Database) -> None:
    user_id = await make_user(database)
    token = await sign_in()
    guarded = guarded_app()

    refused = await call("GET", "/needs-permission", guarded, headers=bearer(token))
    assert refused.status_code == 403

    await grant(database, user_id, "editor", ("articles.write",))

    granted = await call("GET", "/needs-permission", guarded, headers=bearer(token))
    assert granted.status_code == 200


# ── RBAC-AUTHORITY-002 ────────────────────────────────────────────────────────

async def test_a_denial_is_generic_and_never_names_the_missing_grant(
    database: Database,
) -> None:
    await make_user(database)
    token = await sign_in()
    guarded = guarded_app()

    role_denial = await call("GET", "/needs-role", guarded, headers=bearer(token))
    permission_denial = await call("GET", "/needs-permission", guarded, headers=bearer(token))

    for denial in (role_denial, permission_denial):
        assert denial.status_code == 403
        assert denial.json()["errorCode"] == "AUTH_FORBIDDEN"
        # The map of the authorization model is worth more than any single
        # denial: the body must not leak a grant name.
        assert "editor" not in denial.text
        assert "articles.write" not in denial.text
    # Two different missing grants, one indistinguishable answer.
    assert role_denial.json()["message"] == permission_denial.json()["message"]
    # And the baseline envelope is intact.
    assert role_denial.json()["success"] is False
    assert role_denial.json()["path"] == "/needs-role"
    assert role_denial.json()["timestamp"]


# ── RBAC-AUTHORITY-003 ────────────────────────────────────────────────────────

async def test_authentication_is_resolved_before_authorization(database: Database) -> None:
    await make_user(database)
    guarded = guarded_app()

    anonymous = await call("GET", "/needs-role", guarded)
    invalid = await call("GET", "/needs-role", guarded, headers=bearer("not-a-token"))

    # 401, never 403: answering "forbidden" to an anonymous caller would tell it
    # the route exists and that some grant opens it.
    for response in (anonymous, invalid):
        assert response.status_code == 401
        assert response.json()["errorCode"] != "AUTH_FORBIDDEN"

    assert (await call("GET", SUMMARY)).status_code == 401


# ── RBAC-AUTHORITY-004 ────────────────────────────────────────────────────────

async def test_authorization_is_deny_by_default(database: Database) -> None:
    user_id = await make_user(database)
    token = await sign_in()
    guarded = guarded_app()

    # No grant at all: a route that declares a requirement is closed.
    assert (await call("GET", "/needs-role", guarded, headers=bearer(token))).status_code == 403

    # A role that grants nothing does not open a permission-guarded route: the
    # question is whether the grant is held, never whether it is absent.
    await grant(database, user_id, "reader")
    refused = await call("GET", "/needs-permission", guarded, headers=bearer(token))
    assert refused.status_code == 403

    # A route declaring no requirement stays open to any authenticated principal.
    assert (await call("GET", SUMMARY, headers=bearer(token))).status_code == 200


# ── RBAC-AUTHORITY-005 ────────────────────────────────────────────────────────

async def test_every_denial_is_recorded_as_a_business_audit_event(
    database: Database,
) -> None:
    await make_user(database)
    token = await sign_in()
    guarded = guarded_app()

    await call("GET", "/needs-role", guarded, headers=bearer(token))
    await call("GET", "/needs-permission", guarded, headers=bearer(token))

    recorded = await audit_events(database)
    assert recorded.count(events.AUTHORIZATION_DENIED) == 2

    # What the response refuses to say, the audit trail must: an operator
    # investigating a refusal needs to know which grant was missing.
    denials = [
        row for row in await rows_of(database, "audit_logs")
        if row["event_type"] == events.AUTHORIZATION_DENIED
    ]
    assert {row["target_id"] for row in denials} == {"editor", "articles.write"}
    assert {row["target_type"] for row in denials} == {"role", "permission"}


# ── RBAC-AUTHORITY-006 ────────────────────────────────────────────────────────

async def test_the_summary_exposes_sorted_effective_codes_only(database: Database) -> None:
    user_id = await make_user(database)
    await grant(database, user_id, "editor", ("articles.write", "articles.read"))
    await grant(database, user_id, "auditor", ("articles.read", "audit.read"))
    token = await sign_in()

    body = (await call("GET", SUMMARY, headers=bearer(token))).json()

    assert body["roles"] == ["auditor", "editor"]
    # Sorted and deduplicated: `articles.read` is granted twice, held once.
    assert body["permissions"] == ["articles.read", "articles.write", "audit.read"]
    # Codes only — no identifier, no description, no timestamp.
    assert set(body) == {"roles", "permissions"}
    for field in ("id", "description", "createdAt", "created_at"):
        assert field not in (await call("GET", SUMMARY, headers=bearer(token))).text


async def test_the_summary_of_a_principal_without_grants_is_empty(
    database: Database,
) -> None:
    await make_user(database)
    token = await sign_in()

    body = (await call("GET", SUMMARY, headers=bearer(token))).json()

    # Empty, not absent: a principal with no grant still has a summary.
    assert body == {"roles": [], "permissions": []}
