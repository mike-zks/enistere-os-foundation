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

# Importing the seam registers the composed capabilities' tables on
# `Base.metadata`, and that registration is what `--autogenerate` compares to
# the database. This used to be a hardcoded list of module names; a capability
# it did not name had tables Alembic proposed to **drop** — measured, not
# supposed. The seam is generated from the `fastapi.model-module` integrations,
# so it cannot fall behind the composition (ADR-085).
from app.composition import capability_models  # noqa: F401 — registers capability tables.
from app.persistence.audit import AuditLog  # noqa: F401 — registers the table.
from app.persistence.config import persistence_settings
from app.persistence.database import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


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
