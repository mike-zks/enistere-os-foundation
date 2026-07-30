from functools import lru_cache

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class PersistenceSettings(BaseSettings):
    """Database configuration.

    `extra="forbid"` mirrors the baseline settings: a typo in an environment
    variable must fail at boot rather than silently leave a default in place.
    """

    model_config = SettingsConfigDict(env_prefix="ENISTERE_", extra="ignore")

    database_url: PostgresDsn = Field(
        default=PostgresDsn("postgresql+asyncpg://enistere:enistere@localhost:5432/enistere"),
    )
    database_pool_size: int = Field(default=5, ge=1, le=100)
    database_pool_max_overflow: int = Field(default=5, ge=0, le=100)
    database_statement_timeout_ms: int = Field(default=10_000, ge=100, le=120_000)

    @field_validator("database_url", mode="before")
    @classmethod
    def require_async_driver(cls, value: object) -> object:
        """Refuse a synchronous DSN instead of blocking the event loop with it.

        `postgresql://` is what every operator has in their notes, and SQLAlchemy
        would happily accept it with the blocking psycopg driver — freezing the
        whole application on every query. Normalising is friendlier than failing,
        and unambiguous.
        """
        if isinstance(value, str) and value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value


@lru_cache
def persistence_settings() -> PersistenceSettings:
    return PersistenceSettings()
