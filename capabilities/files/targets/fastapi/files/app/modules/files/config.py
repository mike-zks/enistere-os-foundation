from functools import lru_cache

from pydantic import Field, HttpUrl, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class FilesSettings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    endpoint: HttpUrl = Field(validation_alias="S3_ENDPOINT")
    region: str = Field(default="us-east-1", min_length=1, validation_alias="S3_REGION")
    access_key: SecretStr = Field(validation_alias="S3_ACCESS_KEY_ID")
    secret_key: SecretStr = Field(validation_alias="S3_SECRET_ACCESS_KEY")
    bucket: str = Field(min_length=3, max_length=63, validation_alias="S3_BUCKET")
    force_path_style: bool = Field(default=True, validation_alias="S3_FORCE_PATH_STYLE")
    max_size_bytes: int = Field(
        default=10_485_760, ge=1, le=104_857_600, validation_alias="FILE_MAX_SIZE_BYTES",
    )
    owner_max_active_files: int = Field(
        default=0, ge=0, validation_alias="FILE_OWNER_MAX_ACTIVE_FILES",
    )
    owner_max_total_bytes: int = Field(
        default=0, ge=0, validation_alias="FILE_OWNER_MAX_TOTAL_BYTES",
    )
    signed_url_ttl_seconds: int = Field(
        default=300, ge=30, le=900, validation_alias="FILE_SIGNED_URL_TTL_SECONDS",
    )
    purge_retention_seconds: int = Field(
        default=604_800, ge=0, validation_alias="FILE_PURGE_RETENTION_SECONDS",
    )
    storage_timeout_seconds: float = Field(
        default=30.0, gt=0, le=300, validation_alias="FILE_STORAGE_TIMEOUT_SECONDS",
    )


@lru_cache
def files_settings() -> FilesSettings:
    return FilesSettings()
