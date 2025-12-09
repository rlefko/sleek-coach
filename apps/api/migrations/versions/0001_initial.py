"""Initial baseline migration.

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade database schema.

    This is an empty baseline migration. Actual tables will be created
    in subsequent migrations as features are implemented.
    """
    pass


def downgrade() -> None:
    """Downgrade database schema."""
    pass
