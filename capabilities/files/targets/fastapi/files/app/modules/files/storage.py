from __future__ import annotations

import asyncio
from datetime import timedelta
from io import BytesIO
from typing import Protocol
from urllib.parse import urlsplit

import urllib3
from minio import Minio
from minio.error import S3Error

from .config import files_settings


class ObjectStorage(Protocol):
    async def put(self, key: str, content: bytes, content_type: str) -> None: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...
    async def signed_download_url(self, key: str, ttl_seconds: int) -> str: ...


class MinioObjectStorage:
    """Async boundary around the synchronous MinIO SDK.

    The client opens no socket at construction. Every blocking call is moved off
    the event loop and carries an explicit timeout, so a storage incident cannot
    freeze unrelated FastAPI requests.
    """

    def __init__(self) -> None:
        config = files_settings()
        endpoint = urlsplit(str(config.endpoint))
        if not endpoint.hostname:
            raise ValueError("S3_ENDPOINT must name a host")
        authority = endpoint.hostname
        if endpoint.port:
            authority = f"{authority}:{endpoint.port}"
        timeout = urllib3.Timeout(
            connect=config.storage_timeout_seconds,
            read=config.storage_timeout_seconds,
        )
        self._client = Minio(
            authority,
            access_key=config.access_key.get_secret_value(),
            secret_key=config.secret_key.get_secret_value(),
            secure=endpoint.scheme == "https",
            region=config.region,
            http_client=urllib3.PoolManager(timeout=timeout, retries=False),
        )
        self._bucket = config.bucket

    async def put(self, key: str, content: bytes, content_type: str) -> None:
        await asyncio.to_thread(
            self._client.put_object,
            self._bucket,
            key,
            BytesIO(content),
            len(content),
            content_type=content_type,
        )

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(self._client.remove_object, self._bucket, key)

    async def exists(self, key: str) -> bool:
        try:
            await asyncio.to_thread(self._client.stat_object, self._bucket, key)
        except S3Error as error:
            if error.code in {"NoSuchKey", "NoSuchObject", "NotFound"}:
                return False
            raise
        return True

    async def signed_download_url(self, key: str, ttl_seconds: int) -> str:
        return await asyncio.to_thread(
            self._client.presigned_get_object,
            self._bucket,
            key,
            expires=timedelta(seconds=ttl_seconds),
        )


_storage: ObjectStorage | None = None


def require_storage() -> ObjectStorage:
    global _storage  # noqa: PLW0603 — one adapter per generated application.
    if _storage is None:
        _storage = MinioObjectStorage()
    return _storage


def set_storage(storage: ObjectStorage | None) -> None:
    global _storage  # noqa: PLW0603 — explicit test/runtime substitution seam.
    _storage = storage
