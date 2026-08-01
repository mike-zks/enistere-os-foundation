"""Alembic environment, wired to the application's own configuration.

Online-only and asynchronous: the application talks to PostgreSQL over asyncpg,
and running migrations through a second, synchronous driver would mean the schema
is validated against a connection the application never uses.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.persistence.audit import AuditLog  # noqa: F401 — registers the table.
from app.persistence.config import persistence_settings
from app.persistence.database import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _import_capability_models() -> None:
    """Imports the models of composed capabilities so autogenerate sees them.

    Guarded, and deliberately enumerated: a base project has none of these, and a
    project that composed only Authentication has no authorization module. The
    enumeration is a known limitation — a capability added later is invisible to
    `--autogenerate` until it is listed here — and the clean fix is a composition
    seam for model modules (ADR-079).
    """
    for module in ("app.modules.auth.models", "app.modules.authorization.models"):
        try:
            __import__(module)
        except ImportError:  # pragma: no cover — depends on the composition.
            pass


_import_capability_models()


def run_migrations_offline() -> None:
    raise RuntimeError(
        "offline migrations are not supported: the schema must be applied through "
        "the same async driver the application uses",
    )


def _run(connection: object) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)  # type: ignore[arg-type]
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(str(persistence_settings().database_url))
    try:
        async with engine.connect() as connection:
            await connection.run_sync(_run)
            await connection.commit()
    finally:
        await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
