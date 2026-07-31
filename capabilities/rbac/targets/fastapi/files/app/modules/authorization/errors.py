from __future__ import annotations

from ..auth.errors import AuthError

AUTH_FORBIDDEN = "AUTH_FORBIDDEN"


def forbidden() -> AuthError:
    """The single refusal an authorization denial may produce.

    Deliberately generic: the response never says which role or permission was
    required. Telling a caller what it lacks is telling it what exists, and the
    map of an authorization model is worth more to an attacker than any single
    denial.

    It reuses `AuthError` — and therefore the handler Authentication already
    composes — because RBAC declares `requires: ["auth"]`. A second error type
    would mean a second handler producing a byte-identical envelope, and two
    places to keep in step.
    """
    return AuthError(403, AUTH_FORBIDDEN, "Forbidden.")
