from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from urllib.parse import urlsplit

import pytest
import urllib3
from minio import Minio
from minio.error import S3Error

from app.modules.files.config import files_settings
from app.modules.files.storage import set_storage

# Files requires RBAC, which requires Auth. Re-export their fixtures instead of
# constructing a competing database lifecycle for the same composed app.
from tests.authorization.conftest import (  # noqa: F401
    DATABASE_CONFIGURED,
    REQUIRE_DATABASE,
    anyio_backend,
    audit_events,
    database,
    grant,
    make_user,
    rows_of,
)


def _client() -> Minio:
    settings = files_settings()
    endpoint = urlsplit(str(settings.endpoint))
    authority = endpoint.hostname or ""
    if endpoint.port:
        authority = f"{authority}:{endpoint.port}"
    return Minio(
        authority,
        access_key=settings.access_key.get_secret_value(),
        secret_key=settings.secret_key.get_secret_value(),
        secure=endpoint.scheme == "https",
        region=settings.region,
        http_client=urllib3.PoolManager(retries=False),
    )


async def _empty_bucket(client: Minio, bucket: str) -> None:
    objects = await asyncio.to_thread(lambda: list(client.list_objects(bucket, recursive=True)))
    for item in objects:
        await asyncio.to_thread(client.remove_object, bucket, item.object_name)


@pytest.fixture
async def object_store() -> AsyncIterator[Minio]:
    """A real, private MinIO bucket; absence of MinIO is a test failure.

    This fixture only exists in the Files composition. Therefore a configured
    PostgreSQL golden cannot turn object-store proofs into skips or fakes.
    """
    client = _client()
    bucket = files_settings().bucket
    exists = await asyncio.to_thread(client.bucket_exists, bucket)
    if not exists:
        await asyncio.to_thread(client.make_bucket, bucket, files_settings().region)
    try:
        await asyncio.to_thread(client.delete_bucket_policy, bucket)
    except S3Error as error:
        if error.code != "NoSuchBucketPolicy":
            raise
    await _empty_bucket(client, bucket)
    set_storage(None)
    try:
        yield client
    finally:
        set_storage(None)
        await _empty_bucket(client, bucket)


@pytest.fixture(autouse=True)
def stable_files_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("FILE_MAX_SIZE_BYTES", "10485760")
    monkeypatch.setenv("FILE_OWNER_MAX_ACTIVE_FILES", "0")
    monkeypatch.setenv("FILE_OWNER_MAX_TOTAL_BYTES", "0")
    monkeypatch.setenv("FILE_PURGE_RETENTION_SECONDS", "0")
    files_settings.cache_clear()
    yield
    files_settings.cache_clear()
    set_storage(None)
