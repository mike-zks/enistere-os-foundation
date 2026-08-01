"""Add private file metadata.

Revision ID: 0004_files
Revises: 0003_rbac
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_files"
down_revision: str | None = "0003_rbac"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "stored_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False, unique=True),
        sa.Column("bucket", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=127), nullable=False),
        sa.Column("extension", sa.String(length=20), nullable=False),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column("checksum", sa.String(length=64), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject_id", sa.String(length=128), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("size > 0", name="ck_stored_files_size_positive"),
    )
    op.create_index("idx_stored_files_owner_id", "stored_files", ["owner_id"])
    op.create_index("idx_stored_files_status", "stored_files", ["status"])
    op.create_index(
        "idx_stored_files_owner_page",
        "stored_files",
        ["owner_id", "created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("idx_stored_files_owner_page", table_name="stored_files")
    op.drop_index("idx_stored_files_status", table_name="stored_files")
    op.drop_index("idx_stored_files_owner_id", table_name="stored_files")
    op.drop_table("stored_files")
