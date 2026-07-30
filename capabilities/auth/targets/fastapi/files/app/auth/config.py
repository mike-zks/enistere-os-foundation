from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MINIMUM_SECRET_LENGTH = 32


class AuthSettings(BaseSettings):
    """Authentication configuration.

    The two secrets have no defaults and no fallback. A development default would
    be the value that reaches production the day someone forgets to set the
    variable, and a signing key that leaks is a key that mints sessions.

    There is deliberately no refresh *signing* secret: refresh tokens are opaque
    (see `tokens.py`), so nothing about them is signed. What the second secret
    keys is their fingerprint.
    """

    model_config = SettingsConfigDict(env_prefix="", extra="ignore")

    jwt_access_secret: str = Field(alias="JWT_ACCESS_SECRET")
    refresh_token_hash_secret: str = Field(alias="REFRESH_TOKEN_HASH_SECRET")

    access_token_ttl_seconds: int = Field(default=900, ge=60, le=86_400, alias="AUTH_ACCESS_TTL")
    refresh_token_ttl_seconds: int = Field(
        default=2_592_000, ge=3_600, le=31_536_000, alias="AUTH_REFRESH_TTL",
    )
    jwt_issuer: str = Field(default="enistere", alias="JWT_ISSUER")

    login_rate_limit: int = Field(default=10, ge=1, le=100_000, alias="AUTH_LOGIN_RATE_LIMIT")
    refresh_rate_limit: int = Field(default=30, ge=1, le=100_000, alias="AUTH_REFRESH_RATE_LIMIT")

    @field_validator("jwt_access_secret", "refresh_token_hash_secret")
    @classmethod
    def reject_weak_secret(cls, value: str) -> str:
        if len(value) < MINIMUM_SECRET_LENGTH:
            raise ValueError(f"secrets must be at least {MINIMUM_SECRET_LENGTH} characters")
        return value

    @field_validator("refresh_token_hash_secret")
    @classmethod
    def reject_shared_secret(cls, value: str, info: object) -> str:
        """Refuse one value for both secrets.

        They protect different things — one signs access tokens, the other keys
        refresh fingerprints — and reusing a value means one disclosure costs
        both guarantees at once.
        """
        access = getattr(info, "data", {}).get("jwt_access_secret")
        if access is not None and value == access:
            raise ValueError("the access and fingerprint secrets must differ")
        return value


@lru_cache
def auth_settings() -> AuthSettings:
    return AuthSettings()  # type: ignore[call-arg] — populated from the environment.
