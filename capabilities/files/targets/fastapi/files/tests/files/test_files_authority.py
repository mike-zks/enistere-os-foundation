from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from io import BytesIO
from urllib.parse import quote

import httpx
import pytest
from minio import Minio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.modules.auth.ratelimit import reset as reset_rate_limits
from app.modules.files import audit_events as file_events
from app.modules.files.config import files_settings
from app.modules.files.errors import FILE_MAINTENANCE_BUSY, FilesError
from app.modules.files.models import FileCategory, FileStatus, StoredFile
from app.modules.files.repository import MAINTENANCE_LOCK_KEY, MAINTENANCE_LOCK_STATEMENT
from app.modules.files.service import RequestContext, purge_deleted, upload
from app.persistence.database import Database

from .conftest import (
    DATABASE_CONFIGURED,
    grant,
    make_user,
    rows_of,
)
from .conftest import (
    audit_events as recorded_audit_events,
)

pytestmark = [
    pytest.mark.anyio,
    pytest.mark.skipif(
        not DATABASE_CONFIGURED,
        reason="ENISTERE_DATABASE_URL is not set; Files authority proofs need PostgreSQL",
    ),
]

PASSWORD = "correct horse battery staple"  # noqa: S105 — disposable fixture.
PNG = b"\x89PNG\r\n\x1a\n" + b"controlled-test-content"
PDF = b"%PDF-1.7\n" + b"controlled-test-document"


async def call(method: str, path: str, **kwargs: object) -> httpx.Response:
    reset_rate_limits()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, **kwargs)  # type: ignore[arg-type]


async def sign_in(email: str) -> str:
    response = await call(
        "POST",
        "/api/v1/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    assert response.status_code == 200
    return response.json()["accessToken"]


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def principal(
    database: Database,
    email: str,
    permissions: tuple[str, ...],
) -> tuple[uuid.UUID, str]:
    user_id = await make_user(database, email)
    await grant(database, user_id, f"role-{uuid.uuid4().hex}", permissions)
    return user_id, await sign_in(email)


async def post_file(
    token: str,
    *,
    content: bytes = PNG,
    filename: str = "proof.png",
    category: str = "IMAGE",
) -> httpx.Response:
    return await call(
        "POST",
        "/api/v1/files/upload",
        headers=bearer(token),
        files={"file": (filename, content, "application/octet-stream")},
        data={"category": category},
    )


# FILES-AUTHORITY-001/002/003/004/011
async def test_upload_is_authorized_detected_private_and_publicly_redacted(
    database: Database,
    object_store: Minio,
) -> None:
    owner_id, token = await principal(database, "owner@example.test", ("files.upload",))

    assert (await post_file("not-a-token")).status_code == 401  # noqa: S106 — invalid fixture.
    _, denied = await principal(database, "denied@example.test", ())
    assert (await post_file(denied)).status_code == 403

    unknown = await post_file(token, content=b"not an image")
    mismatch = await post_file(token, content=PDF, filename="proof.pdf", category="IMAGE")
    wrong_extension = await post_file(token, filename="proof.pdf")
    for refusal in (unknown, mismatch, wrong_extension):
        assert refusal.status_code == 400
        assert refusal.json()["success"] is False
        assert refusal.json()["errorCode"].startswith("FILE_")

    created = await post_file(token)
    assert created.status_code == 201
    body = created.json()
    assert set(body) == {
        "id", "originalName", "mimeType", "size", "category", "status", "subjectId", "createdAt",
    }
    assert body["mimeType"] == "image/png"
    assert body["status"] == "VALIDATED"
    assert not {"storageKey", "bucket", "checksum", "ownerId"} & set(body)

    rows = await rows_of(database, "stored_files")
    assert len(rows) == 1
    stored = rows[0]
    assert stored["owner_id"] == owner_id
    assert stored["checksum"]
    assert await asyncio.to_thread(
        object_store.stat_object,
        files_settings().bucket,
        stored["storage_key"],
    )

    endpoint = str(files_settings().endpoint).rstrip("/")
    unsigned = f"{endpoint}/{quote(files_settings().bucket)}/{quote(stored['storage_key'])}"
    async with httpx.AsyncClient() as client:
        public_read = await client.get(unsigned)
    assert public_read.status_code in {401, 403}
    assert file_events.FILE_UPLOADED in await audit_events_from(database)


# FILES-AUTHORITY-001/005/006/008/011
async def test_ownership_listing_signed_download_and_quarantine_lifecycle(
    database: Database,
    object_store: Minio,
) -> None:
    _, owner = await principal(
        database,
        "owner@example.test",
        ("files.upload", "files.read", "files.download"),
    )
    _, stranger = await principal(
        database,
        "stranger@example.test",
        ("files.read", "files.download"),
    )
    _, admin = await principal(
        database,
        "admin@example.test",
        ("files.quarantine", "files.restore"),
    )
    first = (await post_file(owner, filename="first.png")).json()
    second = (await post_file(owner, filename="second.png")).json()

    hidden = await call("GET", f"/api/v1/files/{first['id']}", headers=bearer(stranger))
    assert hidden.status_code == 404
    hidden_download = await call(
        "POST",
        f"/api/v1/files/{first['id']}/download-url",
        headers=bearer(stranger),
    )
    assert hidden_download.status_code == 404

    own_metadata = await call(
        "GET",
        f"/api/v1/files/{first['id']}",
        headers=bearer(owner),
    )
    assert own_metadata.status_code == 200

    listing = await call("GET", "/api/v1/files?limit=1", headers=bearer(owner))
    assert listing.status_code == 200
    page = listing.json()
    assert page["total"] == 2
    assert page["nextOffset"] == 1
    assert page["items"][0]["id"] == second["id"]
    assert all(item.get("ownerId") is None for item in page["items"])

    grant = await call(
        "POST",
        f"/api/v1/files/{first['id']}/download-url",
        headers=bearer(owner),
    )
    assert grant.status_code == 200
    assert grant.headers["cache-control"] == "no-store"
    assert grant.json()["expiresIn"] <= 900
    async with httpx.AsyncClient() as client:
        downloaded = await client.get(grant.json()["url"])
    assert downloaded.status_code == 200
    assert downloaded.content == PNG

    owner_refused = await call(
        "POST",
        f"/api/v1/files/{first['id']}/quarantine",
        headers=bearer(owner),
    )
    assert owner_refused.status_code == 403
    quarantined = await call(
        "POST",
        f"/api/v1/files/{first['id']}/quarantine",
        headers=bearer(admin),
    )
    assert quarantined.status_code == 204
    blocked = await call(
        "POST",
        f"/api/v1/files/{first['id']}/download-url",
        headers=bearer(owner),
    )
    assert blocked.status_code == 404
    restored = await call(
        "POST",
        f"/api/v1/files/{first['id']}/restore",
        headers=bearer(admin),
    )
    assert restored.status_code == 204
    assert (await call(
        "POST",
        f"/api/v1/files/{first['id']}/download-url",
        headers=bearer(owner),
    )).status_code == 200

    events = await audit_events_from(database)
    assert file_events.METADATA_ACCESSED in events
    assert file_events.DOWNLOAD_URL_ISSUED in events
    assert file_events.QUARANTINED in events
    assert file_events.QUARANTINE_RELEASED in events


# FILES-AUTHORITY-007/011
async def test_delete_is_idempotent_removes_the_object_and_invalidates_issued_urls(
    database: Database,
    object_store: Minio,
) -> None:
    _, token = await principal(
        database,
        "owner@example.test",
        ("files.upload", "files.read", "files.download", "files.delete"),
    )
    _, without_delete = await principal(
        database,
        "reader@example.test",
        ("files.read",),
    )
    file_id = (await post_file(token)).json()["id"]
    grant = (await call(
        "POST",
        f"/api/v1/files/{file_id}/download-url",
        headers=bearer(token),
    )).json()["url"]

    refused = await call(
        "DELETE",
        f"/api/v1/files/{file_id}",
        headers=bearer(without_delete),
    )
    assert refused.status_code == 403
    first = await call("DELETE", f"/api/v1/files/{file_id}", headers=bearer(token))
    second = await call("DELETE", f"/api/v1/files/{file_id}", headers=bearer(token))
    assert first.status_code == second.status_code == 204
    assert (await call("GET", f"/api/v1/files/{file_id}", headers=bearer(token))).status_code == 404
    listing = await call("GET", "/api/v1/files", headers=bearer(token))
    assert listing.json()["items"] == []
    async with httpx.AsyncClient() as client:
        assert (await client.get(grant)).status_code == 404
    assert await asyncio.to_thread(
        lambda: list(object_store.list_objects(files_settings().bucket, recursive=True)),
    ) == []

    events = await audit_events_from(database)
    assert file_events.DELETION_REQUESTED in events
    assert file_events.OBJECT_DELETED in events
    assert file_events.DELETED in events


# FILES-AUTHORITY-009
async def test_reconciliation_refuses_a_second_run_and_purges_only_confirmed_absence(
    database: Database,
    object_store: Minio,
) -> None:
    owner_id = await make_user(database, "owner@example.test")
    present = await insert_deleted(database, owner_id, "present.png")
    await insert_deleted(database, owner_id, "absent.png")
    await asyncio.to_thread(
        object_store.put_object,
        files_settings().bucket,
        present.storage_key,
        BytesIO(PNG),
        len(PNG),
        content_type="image/png",
    )

    report = await purge_deleted()
    assert report.examined == 2
    assert report.purged == 1
    assert report.kept_object_present == 1
    remaining = await rows_of(database, "stored_files")
    assert {row["id"] for row in remaining} == {present.id}

    async with database.engine.connect() as connection:
        assert await connection.scalar(
            MAINTENANCE_LOCK_STATEMENT,
            {"key": MAINTENANCE_LOCK_KEY},
        )
        await connection.commit()
        try:
            with pytest.raises(FilesError) as refusal:
                await purge_deleted()
            assert refusal.value.error_code == FILE_MAINTENANCE_BUSY
        finally:
            await connection.execute(
                text("SELECT pg_advisory_unlock(hashtext(:key)::bigint)"),
                {"key": MAINTENANCE_LOCK_KEY},
            )
            await connection.commit()


# FILES-AUTHORITY-010
async def test_owner_quota_cannot_be_exceeded_by_concurrent_uploads(
    database: Database,
    object_store: Minio,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    owner_id = await make_user(database, "owner@example.test")
    monkeypatch.setenv("FILE_OWNER_MAX_ACTIVE_FILES", "1")
    files_settings.cache_clear()

    outcomes = await asyncio.gather(
        upload(owner_id, PNG, "one.png", FileCategory.IMAGE, None, RequestContext(None, None)),
        upload(owner_id, PNG, "two.png", FileCategory.IMAGE, None, RequestContext(None, None)),
        return_exceptions=True,
    )
    assert sum(not isinstance(outcome, Exception) for outcome in outcomes) == 1
    refusals = [outcome for outcome in outcomes if isinstance(outcome, FilesError)]
    assert len(refusals) == 1
    assert refusals[0].error_code == "FILE_STORAGE_QUOTA_EXCEEDED"
    assert len(await rows_of(database, "stored_files")) == 1
    assert len(await asyncio.to_thread(
        lambda: list(object_store.list_objects(files_settings().bucket, recursive=True)),
    )) == 1


async def insert_deleted(database: Database, owner_id: uuid.UUID, key: str) -> StoredFile:
    row = StoredFile(
        id=uuid.uuid4(),
        original_name=key,
        storage_key=key,
        bucket=files_settings().bucket,
        mime_type="image/png",
        extension="png",
        size=len(PNG),
        checksum="0" * 64,
        category=FileCategory.IMAGE.value,
        status=FileStatus.DELETED.value,
        owner_id=owner_id,
        created_at=datetime.now(UTC) - timedelta(days=2),
        updated_at=datetime.now(UTC) - timedelta(days=2),
    )

    async def write(session: AsyncSession) -> None:
        session.add(row)

    await database.transaction(write)
    return row


async def audit_events_from(database: Database) -> list[str]:
    return await recorded_audit_events(database)
