from __future__ import annotations

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError

# Argon2id at the library defaults, which follow the current OWASP guidance and
# are the same family Spring uses. The parameters are deliberately not tuned
# down: a hash that is cheap to compute is a hash that is cheap to attack.
_hasher = PasswordHasher()

#: A real Argon2id hash of a value nobody knows. Verifying against it costs the
#: same as verifying a genuine one — which is the point.
_DUMMY_HASH = _hasher.hash("enistere-timing-equaliser")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def waste_verification_time() -> None:
    """Spends the cost of a verification against a hash that cannot match.

    Called when the identity does not exist. Without it, an unknown address
    answers in microseconds and a known one in tens of milliseconds: the response
    body says `AUTH_INVALID_CREDENTIALS` either way, but the clock enumerates the
    account list just as well.
    """
    verify_password("enistere-timing-equaliser-probe", _DUMMY_HASH)


def needs_rehash(password_hash: str) -> bool:
    """True when the stored hash predates the current parameters."""
    return _hasher.check_needs_rehash(password_hash)
