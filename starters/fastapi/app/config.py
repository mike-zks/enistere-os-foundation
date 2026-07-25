from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class RuntimeSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ENISTERE_", extra="forbid")

    service_name: str = Field(default="api-fastapi-core", min_length=1)
    cors_allowed_origins: tuple[str, ...] = ("http://localhost:3000",)
    rate_limit_per_minute: int = Field(default=1000, ge=1, le=100_000)


@lru_cache
def settings() -> RuntimeSettings:
    return RuntimeSettings()
