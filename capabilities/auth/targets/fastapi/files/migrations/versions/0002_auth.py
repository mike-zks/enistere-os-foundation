"""Authentication schema: identities and refresh sessions.

The audit sink used to be created here, because the FastAPI baseline picked no
data provider and the first capability needing persistence had to create it. It
now belongs to the baseline, as it does on the two peer API runtimes (ADR-080).

Revision ID: 0002_auth
Revises: 0001_baseline
Create Date: 2026-07-29
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002_auth"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_users_email", "users", ["email"])

    # The raw refresh token is never stored: `token_hash` is a keyed SHA-256 hex
    # digest. UNIQUE so a collision is a constraint violation rather than an
    # ambiguous lookup, and so rotation cannot silently create a duplicate.
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])
    op.create_index("idx_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("idx_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_table("refresh_tokens")
    op.drop_table("users")
