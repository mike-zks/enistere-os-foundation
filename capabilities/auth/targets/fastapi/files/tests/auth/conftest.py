from __future__ import annotations

import os
import uuid
from collections.abc import AsyncIterator
from typing import Any

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Test-only secrets, set before the settings cache is built. They are disposable
# by construction and never resemble a production value.
os.environ.setdefault("JWT_ACCESS_SECRET", "fastapi_test_access_secret_32_characters")
os.environ.setdefault("REFRESH_TOKEN_HASH_SECRET", "fastapi_test_fingerprint_secret_32_chars")

from app.modules.auth.models import User  # noqa: E402 — must follow the secrets above.
from app.modules.auth.passwords import hash_password  # noqa: E402
from app.persistence.audit import AuditLog  # noqa: E402, F401 — registers audit_logs.
from app.persistence.database import Base, Database, set_database  # noqa: E402

DATABASE_CONFIGURED = bool(os.environ.get("ENISTERE_DATABASE_URL"))

#: The golden runtime always provides a database. If it ever stops doing so, the
#: authority proofs must fail rather than quietly turn into skips — a suite that
#: skips its own subject reports success for having tested nothing.
REQUIRE_DATABASE = os.environ.get("GOLDEN_RUNTIME_DB") == "1"


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    """Runs each async test on one event loop, through anyio's pytest plugin.

    Necessary rather than decorative: asyncpg binds a connection to the loop that
    opened it. Driving each call with its own `asyncio.run` — the style the
    baseline suite can afford because it touches no database — hands the pool to
    a loop that no longer exists on the second call.
    """
    return "asyncio"


@pytest.fixture
async def database() -> AsyncIterator[Database]:
    """A live database with a clean schema, torn down after each test.

    The schema is built from the SQLAlchemy metadata rather than by running
    Alembic. The migration is exercised separately *against that same metadata*,
    so a divergence between the two is reported as a divergence instead of hiding
    behind whichever one the tests happened to use.
    """
    instance = Database.from_settings()
    set_database(instance)
    async with instance.engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    try:
        yield instance
    finally:
        async with instance.engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await instance.dispose()
        set_database(None)


async def make_user(
    database_: Database,
    email: str = "ada@example.test",
    password: str = "correct horse battery staple",  # noqa: S107 — test fixture.
    *,
    is_active: bool = True,
) -> uuid.UUID:
    user_id = uuid.uuid4()

    async def insert(session: AsyncSession) -> None:
        session.add(User(
            id=user_id,
            email=email.strip().lower(),
            password_hash=hash_password(password),
            is_active=is_active,
        ))

    await database_.transaction(insert)
    return user_id


async def audit_events(database_: Database) -> list[str]:
    async def read(session: AsyncSession) -> list[str]:
        result = await session.execute(
            text("SELECT event_type FROM audit_logs ORDER BY created_at"),
        )
        return [row[0] for row in result]

    return await database_.transaction(read)


async def rows_of(database_: Database, table: str) -> list[dict[str, Any]]:
    async def read(session: AsyncSession) -> list[dict[str, Any]]:
        result = await session.execute(text(f"SELECT * FROM {table}"))  # noqa: S608 — fixed names.
        return [dict(row) for row in result.mappings()]

    return await database_.transaction(read)
