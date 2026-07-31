from __future__ import annotations


class AuthError(Exception):
    """A failure the caller is allowed to observe.

    The codes are deliberately coarse: every credential failure collapses into
    `AUTH_INVALID_CREDENTIALS` and every refresh failure into
    `AUTH_REFRESH_TOKEN_INVALID`, so the response never reveals whether an
    identity exists, is disabled, or which token state was hit. The finer reasons
    live in the audit trail, not in the response — the same coarseness the NestJS
    and Spring authorities publish.
    """

    def __init__(self, status_code: int, error_code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.message = message


AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"
AUTH_REFRESH_TOKEN_INVALID = "AUTH_REFRESH_TOKEN_INVALID"  # noqa: S105 — an error code.
AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED"
AUTH_UNAUTHENTICATED = "AUTH_UNAUTHENTICATED"


def invalid_credentials() -> AuthError:
    return AuthError(401, AUTH_INVALID_CREDENTIALS, "Invalid credentials.")


def invalid_refresh_token() -> AuthError:
    return AuthError(401, AUTH_REFRESH_TOKEN_INVALID, "Invalid refresh token.")


def rate_limited() -> AuthError:
    return AuthError(429, AUTH_RATE_LIMITED, "Too many attempts.")


def unauthenticated() -> AuthError:
    return AuthError(401, AUTH_UNAUTHENTICATED, "Authentication required.")
