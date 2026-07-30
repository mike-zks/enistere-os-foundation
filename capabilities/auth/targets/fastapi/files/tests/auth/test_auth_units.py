from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import jwt
import pytest

from app.auth.config import AuthSettings
from app.auth.passwords import hash_password, verify_password
from app.auth.tokens import (
    fingerprint_refresh_token,
    issue_access_token,
    issue_refresh_token,
    read_access_token,
)
from app.persistence.config import PersistenceSettings
from app.persistence.database import Base

SECRET = "fastapi_test_access_secret_32_characters"  # noqa: S105 — disposable test key.


def test_password_hashing_is_argon2id_and_salted() -> None:
    first = hash_password("correct horse")
    second = hash_password("correct horse")

    assert first.startswith("$argon2id$")
    # Distinct salts: two identical passwords must not share a digest, or a
    # single stolen dump reveals which accounts share a password.
    assert first != second
    assert verify_password("correct horse", first)
    assert not verify_password("wrong horse", first)


def test_access_token_pins_its_algorithm_and_rejects_forgeries() -> None:
    user_id = uuid.uuid4()
    token = issue_access_token(user_id)

    assert read_access_token(token) == user_id

    # `alg: none` is the classic forgery; pinning HS256 makes it unreadable.
    unsigned = jwt.encode({"sub": str(user_id), "type": "access"}, key="", algorithm="none")
    assert read_access_token(unsigned) is None
    # A token signed with another key is not ours either.
    foreign = jwt.encode(
        {"sub": str(user_id), "type": "access", "iss": "enistere",
         "iat": int(datetime.now(UTC).timestamp()),
         "exp": int((datetime.now(UTC) + timedelta(minutes=5)).timestamp())},
        "another_secret_that_is_long_enough_32ch",
        algorithm="HS256",
    )
    assert read_access_token(foreign) is None


def test_access_token_refuses_an_expired_or_mistyped_claim_set() -> None:
    user_id = uuid.uuid4()
    now = datetime.now(UTC)
    expired = jwt.encode(
        {"sub": str(user_id), "type": "access", "iss": "enistere",
         "iat": int((now - timedelta(hours=2)).timestamp()),
         "exp": int((now - timedelta(hours=1)).timestamp())},
        SECRET, algorithm="HS256",
    )
    assert read_access_token(expired) is None

    # A refresh-typed token must not open a protected route even when correctly
    # signed: the `type` claim is what keeps the two kinds apart.
    mistyped = jwt.encode(
        {"sub": str(user_id), "type": "refresh", "iss": "enistere",
         "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=5)).timestamp())},
        SECRET, algorithm="HS256",
    )
    assert read_access_token(mistyped) is None


def test_refresh_tokens_are_opaque_and_stored_as_a_keyed_fingerprint() -> None:
    issued = issue_refresh_token()

    # Opaque: nothing to decode, so nothing leaks from the token itself.
    with pytest.raises(jwt.PyJWTError):
        jwt.decode(issued.token, SECRET, algorithms=["HS256"])

    assert issued.fingerprint == fingerprint_refresh_token(issued.token)
    assert len(issued.fingerprint) == 64
    assert issued.token not in issued.fingerprint
    assert issue_refresh_token().token != issued.token


def test_settings_refuse_weak_or_shared_secrets() -> None:
    with pytest.raises(ValueError, match="at least 32 characters"):
        AuthSettings(JWT_ACCESS_SECRET="short", REFRESH_TOKEN_HASH_SECRET=SECRET)  # noqa: S106
    with pytest.raises(ValueError, match="must differ"):
        AuthSettings(JWT_ACCESS_SECRET=SECRET, REFRESH_TOKEN_HASH_SECRET=SECRET)


def test_persistence_settings_normalise_a_synchronous_dsn() -> None:
    # SQLAlchemy would accept the blocking driver and freeze the event loop on
    # every query; normalising is friendlier than failing, and unambiguous.
    settings = PersistenceSettings(ENISTERE_DATABASE_URL="postgresql://u:p@localhost:5432/db")
    assert str(settings.database_url).startswith("postgresql+asyncpg://")


def test_the_migration_creates_exactly_what_the_models_declare() -> None:
    """Pins the migration against the metadata the application actually uses.

    The integration suite builds its schema from the metadata, so without this
    the migration could drift indefinitely and every test would still pass —
    until a real deployment ran the migration and met a different database.
    """
    migration = (
        Path(__file__).resolve().parents[2] / "migrations" / "versions" / "0001_auth_and_audit.py"
    ).read_text(encoding="utf-8")

    for table in Base.metadata.tables:
        assert f'"{table}"' in migration, f"{table} is declared but never migrated"

    for table, model in Base.metadata.tables.items():
        for column in model.columns:
            assert f'"{column.name}"' in migration, f"{table}.{column.name} is missing"
