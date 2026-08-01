from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import TypeVar

from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from ..platform import DiagnosticStatus, diagnostics
from .config import persistence_settings

Result = TypeVar("Result")


class Base(DeclarativeBase):
    """Declarative base shared by every persisted model."""


class Database:
    """Owns the engine and hands out sessions. Created once, at startup.

    Deliberately not a module-level singleton built at import time: importing a
    module must never open a socket. The lifespan hook builds it, and everything
    else receives it.
    """

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine
        self._sessions = async_sessionmaker(engine, expire_on_commit=False)

    @property
    def engine(self) -> AsyncEngine:
        """The engine, for schema management and diagnostics."""
        return self._engine

    @classmethod
    def from_settings(cls) -> Database:
        settings = persistence_settings()
        return cls(create_async_engine(
            str(settings.database_url),
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_pool_max_overflow,
            pool_pre_ping=True,
            # A query that hangs must fail rather than hold a pooled connection
            # forever: an exhausted pool takes the whole application down, not
            # just the request that misbehaved.
            connect_args={
                "server_settings": {
                    "statement_timeout": str(settings.database_statement_timeout_ms),
                },
            },
        ))

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        """A session with no ambient transaction. The caller decides."""
        async with self._sessions() as session:
            yield session

    async def transaction(self, work: Callable[[AsyncSession], Awaitable[Result]]) -> Result:
        """`TransactionPort`: runs `work` in one transaction, committing once.

        Kept short by construction — no network I/O belongs inside — because a
        transaction held across a remote call is how a connection pool starves.
        """
        async with self._sessions() as session, session.begin():
            return await work(session)

    async def ping(self) -> DiagnosticStatus:
        try:
            async with self._engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except Exception:
            return DiagnosticStatus.DEGRADED
        return DiagnosticStatus.OK

    async def dispose(self) -> None:
        await self._engine.dispose()


#: Set by the lifespan hook. Read through `require_database`, never directly, so
#: a missing hook fails loudly instead of yielding `None` into a query.
_database: Database | None = None


def require_database() -> Database:
    if _database is None:
        raise RuntimeError(
            "the persistence lifespan hook has not run: "
            "app.persistence.database.persistence_lifespan is not composed",
        )
    return _database


def set_database(database: Database | None) -> None:
    """Installs the process-wide database. Tests use it to substitute one."""
    global _database  # noqa: PLW0603 — one process, one engine, by design.
    _database = database


@asynccontextmanager
async def persistence_lifespan(_: FastAPI) -> AsyncIterator[None]:
    """`fastapi.lifespan` hook: opens the pool, publishes readiness, closes it.

    The readiness probe is registered here rather than at import so that a
    project without persistence never advertises a database check it cannot
    answer.
    """
    database = Database.from_settings()
    set_database(database)
    diagnostics.register("database", database.ping)
    try:
        yield
    finally:
        diagnostics.unregister("database")
        set_database(None)
        await database.dispose()
