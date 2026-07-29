"""Relational persistence adapter, brought by the capability that needs it.

The FastAPI baseline deliberately chooses no data provider: it declares
`PersistencePort`, `MigrationPort` and `TransactionPort` and stops there. This
package specialises those ports with SQLAlchemy, asyncpg and Alembic.

It is kept apart from `app.auth` on purpose. Nothing here knows what a user or a
refresh session is, so the day a second capability needs persistence — or the day
the baseline decides to pick a provider itself — this package moves as a whole
instead of being untangled from authentication logic.
"""
