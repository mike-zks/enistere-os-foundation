"""Authorization for the FastAPI runtime.

Exports the router the composition seam references, and the two guards a later
capability uses to protect its own routes — the extension point Files will use.
"""

from .dependencies import requires_permission, requires_role
from .router import router

__all__ = ["requires_permission", "requires_role", "router"]
