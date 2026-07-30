"""Authentication authority for the FastAPI runtime.

Exports the two symbols the composition seams reference — the router and the
error handler — plus `require_user`, the dependency a later capability uses to
protect its own routes.
"""

from .errors import AuthError
from .handlers import auth_error_handler
from .router import require_user, router

__all__ = ["AuthError", "auth_error_handler", "require_user", "router"]
