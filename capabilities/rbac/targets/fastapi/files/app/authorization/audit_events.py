"""Audit event types emitted by the RBAC capability.

One event, on purpose. A grant that is held produces ordinary traffic; a grant
that is missing is what an operator needs to see. The same identifier the NestJS
and Spring authorities emit, so a deployment can correlate the three.
"""

AUTHORIZATION_DENIED = "AUTHORIZATION_DENIED"
