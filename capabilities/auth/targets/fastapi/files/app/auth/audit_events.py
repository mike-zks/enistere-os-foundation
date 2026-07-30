"""Audit event types emitted by the Auth capability.

The baseline audit infrastructure imposes no registry: each capability declares
its own stable SCREAMING_SNAKE_CASE identifiers and records them through the
generic sink. These five are the same identifiers the NestJS and Spring
authorities emit, so a deployment can correlate the three without a mapping
table.
"""

LOGIN_SUCCEEDED = "AUTH_LOGIN_SUCCEEDED"
LOGIN_FAILED = "AUTH_LOGIN_FAILED"
REFRESH_SUCCEEDED = "AUTH_REFRESH_SUCCEEDED"  # noqa: S105 — an event name.
REFRESH_FAILED = "AUTH_REFRESH_FAILED"  # noqa: S105 — an event name.
LOGOUT = "AUTH_LOGOUT"
