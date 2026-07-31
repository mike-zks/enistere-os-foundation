from __future__ import annotations

import time
from collections import defaultdict, deque

from .errors import rate_limited

#: Per-route sliding windows, keyed by client. Separate from the baseline limiter
#: on purpose: credential endpoints deserve a far tighter budget than ordinary
#: traffic, and exhausting one must not lock a caller out of the whole API.
_windows: dict[str, deque[float]] = defaultdict(deque)

WINDOW_SECONDS = 60.0


def enforce(route: str, client: str, limit: int) -> None:
    """Raises when `client` exceeded `limit` calls to `route` in the last minute.

    In-memory, like the baseline limiter, and with the same honest caveat: it
    proves the mechanism on one instance. A multi-process deployment must replace
    it with a shared adapter before claiming production readiness — an attacker
    facing four workers otherwise gets four times the budget.
    """
    now = time.monotonic()
    window = _windows[f"{route}|{client}"]
    while window and now - window[0] >= WINDOW_SECONDS:
        window.popleft()
    if len(window) >= limit:
        raise rate_limited()
    window.append(now)


def reset() -> None:
    """Clears every window. For tests only."""
    _windows.clear()
